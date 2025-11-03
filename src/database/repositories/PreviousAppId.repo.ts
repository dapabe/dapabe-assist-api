import { desc, eq } from 'drizzle-orm';

import { UUID } from '../../types/common';
import { DatabaseAdapter, DatabaseRepository } from '../DatabaseRepository';

export class RepositoryPreviousAppId extends DatabaseRepository<DatabaseAdapter> {
  async getAll(): Promise<string[]> {
    const results = await this.db
      .select()
      .from(this.schema.Table_PreviousAppIds)
      .orderBy(desc(this.schema.Table_PreviousAppIds.createdAt));

    return results.map((x) => x.id);
  }

  async remoteEntryExists(appId: UUID): Promise<boolean> {
    const result = await this.db
      .select()
      .from(this.schema.Table_PreviousAppIds)
      .where(eq(this.schema.Table_PreviousAppIds.id, appId))
      .limit(1);
    return result.length > 0;
  }
}
