import { UUID } from './common';
import { IRoomEvent, IRoomEventLiteral } from '../schemas/RoomEvent.schema';

export type RemoteUDPInfo = {
  port: number;
  address: string;
  family: 'IPv4' | 'IPv6';
  size: number;
  // ts: number; // Only in ReactNative
};

/**
 * 	Basic room data used across diferent DTO
 */
export type IRoomData = {
  appId: UUID;
  port: number;
  address: string;
};

export type IRoomListener = IRoomData & {
  responderName: string;
};

export type IWSRoom = IRoomData & {
  callerName: string;
  device: string;
};

export type IWSRoomListener = IWSRoom & {
  needsAssist: boolean;
  disconnected: boolean;
};

export type FromSocketUnion<T extends IRoomEventLiteral> = Omit<
  Extract<IRoomEvent, { event: T }>,
  'event'
>;
