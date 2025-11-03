import { eq } from 'drizzle-orm';

import { UUID } from '../../types/common';
import { DatabaseAdapter, DatabaseRepository } from '../DatabaseRepository';

export class RepositoryListeningTo extends DatabaseRepository<DatabaseAdapter> {
  async get(): Promise<{ appId: UUID; name: string; lastSeen: string }[]> {
    const result = await this.db.select().from(this.schema.Table_ListeningTo);
    return result.map((row) => ({
      appId: row.appId,
      name: row.name,
      lastSeen: new Date(row.lastSeen).toISOString(),
    }));
  }

  async create(appId: UUID, name: string): Promise<void> {
    await this.db
      .insert(this.schema.Table_ListeningTo)
      .values({
        appId,
        name,
        lastSeen: new Date(),
      })
      .onConflictDoUpdate({
        target: this.schema.Table_ListeningTo.appId,
        set: { name, lastSeen: new Date() },
      });
  }

  async delete(appId: UUID): Promise<void> {
    await this.db
      .delete(this.schema.Table_ListeningTo)
      .where(eq(this.schema.Table_ListeningTo.appId, appId));
  }

  async updateLastSeen(appId: UUID): Promise<void> {
    await this.db
      .update(this.schema.Table_ListeningTo)
      .set({ lastSeen: new Date() })
      .where(eq(this.schema.Table_ListeningTo.appId, appId));
  }
}
