import { z } from 'zod';

export type IndexedClassDTO<DTO> = {
  [Schema in Exclude<keyof DTO, 'prototype'>]: DTO[Schema] extends z.ZodType<infer T> ? T : never;
};
