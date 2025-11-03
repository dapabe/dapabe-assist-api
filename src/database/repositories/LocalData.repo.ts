import cuid2 from '@paralleldrive/cuid2';
import { eq, getTableColumns } from 'drizzle-orm';

import { ExpectedError } from '../../errors/ExpectedError';
import { ILocalDataDTO } from '../../schemas/LocalData.schema';
import { IRegisterLocalSchema } from '../../schemas/RegisterLocal.schema';
import { DatabaseAdapter, DatabaseRepository } from '../DatabaseRepository';

export class RepositoryLocalData extends DatabaseRepository<DatabaseAdapter> {
  async get(): Promise<ILocalDataDTO['Read']> {
    const result = await this.db.query.Table_LocalData.findFirst({
      with: { RelCurrentAppId: true },
    });

    if (!result) throw new ExpectedError('db.missingLocalData');

    const previousIds = await this.db
      .select()
      .from(this.schema.Table_PreviousAppIds)
      .orderBy(this.schema.Table_PreviousAppIds.createdAt);

    return {
      currentName: result.currentName,
      currentAppId: result.currentAppId,
      previousAppIds: previousIds.map((p) => p.id),
    };
  }

  async create(data: IRegisterLocalSchema): Promise<void> {
    const exists = await this.entryExists();
    if (exists) throw new ExpectedError('db.onlyOneLocalData');

    const appId = cuid2.createId();

    await this.db.transaction(async (tx) => {
      await tx.insert(this.schema.Table_PreviousAppIds).values({ id: appId });
      await tx
        .insert(this.schema.Table_LocalData)
        .values({ currentName: data.name, currentAppId: appId });
    });
  }

  async patch(data: ILocalDataDTO['Update']): Promise<void> {
    const result = await this.db.select().from(this.schema.Table_LocalData);
    if (result.length === 0) throw new ExpectedError('db.missingLocalData');
    if (result.length > 1) throw new ExpectedError('db.onlyOneLocalData');

    if (data.currentAppId && data.currentAppId !== result[0].currentAppId) {
      // Save old ID to history
      await this.db.insert(this.schema.Table_PreviousAppIds).values({ id: result[0].currentAppId });

      // Save new ID to history
      await this.db.insert(this.schema.Table_PreviousAppIds).values({ id: data.currentAppId });
    }

    await this.db
      .update(this.schema.Table_LocalData)
      .set({
        ...(data.currentName && { currentName: data.currentName }),
        ...(data.currentAppId && { currentAppId: data.currentAppId }),
      })
      .where(eq(this.schema.Table_LocalData.currentAppId, result[0].currentAppId));
  }

  async entryExists(): Promise<boolean> {
    const result = await this.db.select().from(this.schema.Table_LocalData);
    if (result.length > 1) throw new ExpectedError('db.onlyOneLocalData');
    return !!result.length;
  }

  /**
   *  Destructive action, only used in dev mode.
   *  Not neccesary if cache is cleared manually
   */
  async delete(): Promise<void> {
    await this.db.delete(this.schema.Table_LocalData);
    await this.db.delete(this.schema.Table_PreviousAppIds);
  }
}
