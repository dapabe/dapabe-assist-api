import { drizzle as Node } from 'drizzle-orm/better-sqlite3';
import { drizzle as Expo } from 'drizzle-orm/expo-sqlite';

import { schemaBarrel } from './schema-barrel';

export type DatabaseAdapter = ReturnType<
  typeof Node<typeof schemaBarrel> | typeof Expo<typeof schemaBarrel>
>;

export abstract class DatabaseRepository<TDrizzleAdapter extends DatabaseAdapter> {
  protected schema = schemaBarrel;
  constructor(protected db: TDrizzleAdapter) {}
}
