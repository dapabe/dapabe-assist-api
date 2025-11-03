import { z } from 'zod';
import { z18n } from './zod-i18n';

export const SafePortIPv4Schema = z18n.number().int().min(0).max(65535);

export type ISafePortIPv4 = z.infer<typeof SafePortIPv4Schema>;
