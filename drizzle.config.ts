import type { Config } from 'drizzle-kit';

export default {
  schema: './src/database/tables.ts',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
