import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// En serverless (Vercel) usamos pooling con max=1 por invocación
const isServerless = process.env.VERCEL === '1';

export const queryClient = postgres(connectionString, {
  max: isServerless ? 1 : 10,
  prepare: false,
  idle_timeout: 20,
});

export const db = drizzle(queryClient, { schema });
export type Db = typeof db;
export { schema };
