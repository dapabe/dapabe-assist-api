import { EventEmitter } from 'eventemitter3';
import { RoomEventLiteral } from 'src/schemas/RoomEvent.schema';
import { FromSocketUnion, RemoteUDPInfo } from 'src/types/room.context';

import { IRoomState } from './useRoomStore';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const SOCKET_EVENTS_CONSTANTS = {
  NewDiscovery: 'new',
} as const;

type EEMap = {
  [RoomEventLiteral.RespondToAdvertise]: (
    payload: FromSocketUnion<typeof RoomEventLiteral.RespondToAdvertise>,
    rinfo: RemoteUDPInfo
  ) => void;
};
type _store = ReturnType<typeof create<typeof subscribeWithSelector<IRoomState>>>;
// export class RoomEventEmitter extends EventEmitter<EEMap> {
//   private store: _store;
//   constructor(store: _store) {
//     super();
//     this.store = store;
//     this.addListener(RoomEventLiteral.RespondToAdvertise, this.onRemoteRespondToAdvertise);
//   }

//   onRemoteRespondToAdvertise(
//     payload: FromSocketUnion<typeof RoomEventLiteral.RespondToAdvertise>,
//     rinfo: RemoteUDPInfo
//   ) {
//     //	If it hasn't been discovered nor is listening to it, add it to the discover list
//     const isListening = this.store()
//       .getState()
//       .roomsListeningTo.find((x) => x.appId === payload.appId);
//     if (isListening) return;
//     const hasDiscovered = this.store
//       .getState()
//       .roomsToDiscover.findIndex((x) => x.appId === payload.appId);
//     if (hasDiscovered === -1) {
//       this.store.setState((state) => {
//         state.roomsToDiscover.splice(hasDiscovered, 1, {
//           ...payload,
//           port: rinfo.port,
//           address: rinfo.address,
//         });
//         return state;
//       });
//     }
//   }
// }
