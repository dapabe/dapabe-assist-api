import { RegisterLocalSchema } from './RegisterLocal.schema';
import { z18n } from './zod-i18n';
import { IndexedClassDTO } from '../types/IndexedClassDTO.zod';

export class ListeningToDTO {
  static Create = z18n.object({
    appId: z18n.string().cuid2(),
    name: RegisterLocalSchema.shape.name,
    lastSeen: z18n.coerce.date(),
  });
  static Read = ListeningToDTO.Create.merge(
    z18n.object({
      lastSeen: z18n.string().date(),
    })
  );
}

export type IListeningToDTO = IndexedClassDTO<typeof ListeningToDTO>;
