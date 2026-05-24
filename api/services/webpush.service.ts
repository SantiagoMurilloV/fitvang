import webpush from 'web-push';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { pushSubscriptions, notifications } from '../db/schema';
import { env } from '../lib/env';

let configured = false;
function configure() {
  if (configured) return;
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
    configured = true;
  }
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Envía un push a todas las suscripciones activas del usuario y guarda el
 * registro en la tabla `notifications` para que se vea en la campanita.
 */
export async function sendPushToUser(
  userId: string,
  tipo: typeof notifications.$inferInsert.tipo,
  payload: PushPayload,
  metadata: Record<string, unknown> = {},
) {
  // Persistir notification record
  await db.insert(notifications).values({
    userId,
    tipo,
    titulo: payload.title,
    mensaje: payload.body,
    deepLinkUrl: payload.url,
    metadata,
  });

  configure();
  if (!configured) {
    console.warn('[webpush] VAPID no configurado, salto envío real');
    return;
  }

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.activa, true)));

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.update(pushSubscriptions).set({ activa: false }).where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error('[webpush] send error', err?.statusCode, err?.body);
        }
      }
    }),
  );
}
