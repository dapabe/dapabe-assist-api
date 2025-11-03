type Key = 'db.missingLocalData' | 'db.drizzleNoInit' | 'db.onlyOneLocalData';
export class ExpectedError extends Error {
  constructor(public key: Key) {
    super();
    this.name = 'ExpectedError';
  }
}
