import { z } from 'zod';

import { z18n } from './zod-i18n';

export const RegisterLocalSchema = z18n.object({
  name: z18n.string().trim().min(3),
});

export type IRegisterLocalSchema = z.infer<typeof RegisterLocalSchema>;
