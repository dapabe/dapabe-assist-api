import { createId } from '@paralleldrive/cuid2';
import { relations, sql } from 'drizzle-orm';
import { check, index, int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const Table_PreviousAppIds = sqliteTable('previousAppIds', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  createdAt: int('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const Table_LocalData = sqliteTable(
  'localData',
  {
    currentAppId: text('currentAppId')
      .references(() => Table_PreviousAppIds.id)
      .notNull(),
    currentName: text('currentName').notNull(),
  },
  (table) => [
    // check('currentName_trim', sql`trim(${table.currentName}) = ${table.currentName}`),
    // check('currentName_length', sql`length(${table.currentName}) >= 3`),
  ]
);

export const TableRelation_LocalData = relations(Table_LocalData, ({ one }) => ({
  RelCurrentAppId: one(Table_PreviousAppIds, {
    fields: [Table_LocalData.currentAppId],
    references: [Table_PreviousAppIds.id],
  }),
}));

export const Table_ListeningTo = sqliteTable(
  'listeningTo',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    appId: text('appId').notNull(),
    name: text('name').notNull(),
    lastSeen: int('lastSeen', { mode: 'timestamp' })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    // check(table.name.name + '_trim', sql`trim(${table.name}) = ${table.name}`),
    // check(table.name.name + '_length', sql`length(${table.name}) > 3`),
    // index(table.name.name + '_idx').on(table.name),
    // uniqueIndex(table.appId.name + '_idx').on(table.appId),
  ]
);
