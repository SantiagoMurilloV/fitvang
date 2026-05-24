import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { plansRouter } from './routes/plans';
import { classesRouter } from './routes/classes';
import { bookingsRouter } from './routes/bookings';
import { attendanceRouter } from './routes/attendance';
import { paymentsRouter } from './routes/payments';
import { notificationsRouter } from './routes/notifications';
import { statsRouter } from './routes/stats';

export const app = new Hono().basePath('/api');

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    credentials: true,
  })
);

app.get('/health', (c) =>
  c.json({ ok: true, service: 'fitvang-api', time: new Date().toISOString() })
);

app.route('/auth', authRouter);
app.route('/users', usersRouter);
app.route('/plans', plansRouter);
app.route('/classes', classesRouter);
app.route('/bookings', bookingsRouter);
app.route('/attendance', attendanceRouter);
app.route('/payments', paymentsRouter);
app.route('/notifications', notificationsRouter);
app.route('/stats', statsRouter);

app.notFound((c) => c.json({ error: 'not_found', path: c.req.path }, 404));
app.onError((err, c) => {
  console.error('[api error]', err);
  return c.json({ error: 'internal_error', message: err.message }, 500);
});

export type AppType = typeof app;
