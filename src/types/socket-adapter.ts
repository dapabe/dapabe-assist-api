import { ZodError } from 'zod';

import { RemoteUDPInfo } from './room.context';
import { IRoomEvent } from '../schemas/RoomEvent.schema';

export type ISocketIncomingMessage = (data: Buffer | unknown, rinfo: RemoteUDPInfo) => void;
export type FnSocketMessage = (data: IRoomEvent | ZodError) => void;

export type ISocketAdapter = {
  init(port: number, address: string, parser: ISocketIncomingMessage): void;
  addAfterListening(cb: () => void): void;
  close(): void;
  sendTo(port: number, address: string, data: Buffer<ArrayBuffer>): void;
};

export type ISocketClient = {
  init(cbMessage: FnSocketMessage): void;
  close(): void;
  sendTo(port: number, address: string, data: IRoomEvent): void;
  // parseMessage(cb: FnSocketMessage): ISocketIncomingMessage;
  // handleMessage(data: IRoomEvent | ZodError, rinfo: RemoteUDPInfo): void;
};
