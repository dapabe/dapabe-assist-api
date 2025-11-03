import { z18n } from './zod-i18n';

export const NonEmptyStringSchema = z18n.string().trim().min(1);

export const stringToJSONSchema = z18n.string().transform((str, ctx) => {
  try {
    return JSON.parse(str);
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
    return z18n.NEVER;
  }
});
