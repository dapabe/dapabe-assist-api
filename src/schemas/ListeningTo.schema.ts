import { RegisterLocalSchema } from "./RegisterLocal.schema";
import { z18n } from "./zod-i18n";
import { IndexedClassDTO } from "../types/IndexedClassDTO.zod";

export class ListeningToDTO {
  static Create = z18n.object({
    appId: z18n.cuid2(),
    name: RegisterLocalSchema.shape.name,
    lastSeen: z18n.coerce.date(),
  });
  static Read = ListeningToDTO.Create.extend({
    lastSeen: z18n.coerce.date(),
  });
}

export type IListeningToDTO = IndexedClassDTO<typeof ListeningToDTO>;
