import type { Config } from 'drizzle-kit';

if (
  !process.env.MYSQL_HOST ||
  !process.env.MYSQL_POST ||
  !process.env.MYSQL_USER ||
  !process.env.MYSQL_PASSWORD ||
  !process.env.MYSQL_DATABASE
) {
  throw new Error('no mysql config');
}

export default {
  schema: './db/migrations/schema.ts',
  out: './db/migrations',
  driver: 'mysql2',
  dbCredentials: {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_POST),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
} satisfies Config;
