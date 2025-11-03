import { DatabaseAdapter } from './DatabaseRepository';
import { ExpectedError } from '../errors/ExpectedError';
import { RepositoryListeningTo } from './repositories/ListeningTo.repo';
import { RepositoryLocalData } from './repositories/LocalData.repo';

export class DatabaseService {
  private static instance: DatabaseService;
  private adapter: DatabaseAdapter | null = null;

  public Repo!: {
    LocalData: RepositoryLocalData;
    ListeningTo: RepositoryListeningTo;
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public setAdapter(adapter: DatabaseAdapter): void {
    this.adapter = adapter;

    this.Repo = {
      LocalData: new RepositoryLocalData(adapter),
      ListeningTo: new RepositoryListeningTo(adapter),
    };
  }

  public getAdapter(): DatabaseAdapter {
    if (!this.adapter) {
      throw new ExpectedError('db.drizzleNoInit');
    }
    return this.adapter;
  }
}
