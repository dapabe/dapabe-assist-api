import { z } from 'zod';

import { RegisterLocalSchema } from './RegisterLocal.schema';
import { NonEmptyStringSchema } from './utils.schema';
import { z18n } from './zod-i18n';
import { UdpSocketClient } from '../udp-client/UDPClient';

/**
 * @description
 *  - This is the list of all the connection methods available
 */
export const ConnMethod = {
  None: 0,
  LANSocket: 1,
} as const;
export type IConnMethod = (typeof ConnMethod)[keyof typeof ConnMethod];
export type IConnAdapter = UdpSocketClient | null;

export const RoomServiceStatus = {
  Down: 0,
  Starting: 1,
  Up: 2,
} as const;
export type IRoomServiceStatus = (typeof RoomServiceStatus)[keyof typeof RoomServiceStatus];

export const RoomEventLiteral = {
  LookingForDevices: 0,
  RespondToAdvertise: 1,
  BroadcastStop: 2,
  Listening: 3,
  NotListening: 4,
  RequestHelp: 5,
  RequestStop: 6,
  RespondToHelp: 7,
  Invalid: 8,

  AnnieAreYouOkay: 9,
  ImOkay: 10,
} as const;
export type IRoomEventLiteral = (typeof RoomEventLiteral)[keyof typeof RoomEventLiteral];

/**
 * 	This union is parsed at runtime to be used on device communication
 */
export const RoomEventSchema = z18n.union([
  z18n.object({
    event: z18n.literal(RoomEventLiteral.LookingForDevices),
  }),
  z18n.object({
    event: z18n.literal(RoomEventLiteral.RespondToAdvertise),
    appId: NonEmptyStringSchema,
    callerName: RegisterLocalSchema.shape.name,
    device: NonEmptyStringSchema,
  }),
  z18n.object({
    event: z18n.literal(RoomEventLiteral.BroadcastStop),
    appId: NonEmptyStringSchema,
  }),
  z18n.object({
    event: z18n.literal(RoomEventLiteral.Listening),
    appId: NonEmptyStringSchema,
    responderName: RegisterLocalSchema.shape.name,
  }),
  z18n.object({
    event: z18n.literal(RoomEventLiteral.NotListening),
    appId: NonEmptyStringSchema,
  }),
  z18n.object({
    event: z18n.literal(RoomEventLiteral.RequestHelp),
    appId: NonEmptyStringSchema,
    callerName: RegisterLocalSchema.shape.name,
  }),
  z18n.object({
    event: z18n.literal(RoomEventLiteral.RequestStop),
    appId: NonEmptyStringSchema,
  }),
  z18n.object({
    event: z18n.literal(RoomEventLiteral.RespondToHelp),
    responderName: z18n.nullable(RegisterLocalSchema.shape.name), // "null" needed to reset incoming responder,
  }),
  z18n.object({
    event: z18n.literal(RoomEventLiteral.Invalid),
    message: NonEmptyStringSchema,
  }),
  z18n.object({
    event: z18n.literal(RoomEventLiteral.AnnieAreYouOkay),
  }),
  z18n.object({
    event: z18n.literal(RoomEventLiteral.ImOkay),
    appId: NonEmptyStringSchema,
  }),
]);
export type IRoomEvent = z.infer<typeof RoomEventSchema>;

export const RoomPacketSchema = z18n.object({
  id: z18n.string().cuid2(),
  data: RoomEventSchema,
});
export type IRoomPacket = z.infer<typeof RoomPacketSchema>;
