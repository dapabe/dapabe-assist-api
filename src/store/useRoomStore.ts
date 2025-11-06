import { StateCreator } from "zustand/vanilla";

import {
  IAssistanceRoomClientSlice,
  IRoomEmitterSlice,
  IRoomReceiverSlice,
} from "./Room.state";
import {
  ConnMethod,
  RoomEventLiteral,
  RoomServiceStatus,
} from "../schemas/RoomEvent.schema";
import { IRoomData } from "../types/room.context";
import { UdpSocketClient } from "../udp-client/UDPClient";

export type IRoomState = IAssistanceRoomClientSlice &
  IRoomEmitterSlice &
  IRoomReceiverSlice;

/**
 * 	This reducer takes care of most of the app's state and side effects
 * 	It has been done this way to be agnostic to connection methods logic
 * 	and to be used alongside them.
 *
 * 	@edit This was a reducer from react and got stripped to be used
 * 	outside react itself.
 */

/**
 *  @summary Must be used with subscribeWithSelector per enviroment \
 *  or else it will share a state during development, thats a nono.
 */
export const createRoomStore =
  (): StateCreator<IRoomState, [], [], IRoomState> => (set, get) => ({
    // This device state
    connMethod: ConnMethod.None,
    connAdapter: null,
    __status: RoomServiceStatus.Down,
    __currentDevice: null,
    __scheduledToCheck: new Map(),
    __dbRepos: null,

    //  Room receiver values
    __roomsListeningTo: [],
    __roomsToDiscover: [],
    __storedListeners: [],

    //  Room emitter values
    __currentListeners: [],
    __incomingResponder: null,

    updateConnectionMethod: (connMethod, connAdapter) => {
      set({ connMethod, connAdapter });
    },
    getAppId: get().getRepos().LocalData.getCurrentAppId,
    getCurrentName: get().getRepos().LocalData.getCurrentName,
    getCurrentDevice: () => get().__currentDevice,
    getRoomsToDiscover: () => get().__roomsToDiscover,
    getRoomsListeningTo: () => get().__roomsListeningTo,
    getStoredListeners: () => get().__storedListeners,
    getAdapter: () => {
      const adapter = get().connAdapter;
      if (!adapter) throw new Error("No Adapter set in room store");
      return adapter;
    },
    updateMemoryState: (k, v) => set({ [k]: v }),
    __syncDatabase: async (__dbRepos) => {
      set({ __dbRepos });
      const storedListeners = await get().getRepos().ListeningTo.get();
      if (!storedListeners.length) return;
      for (const listener of storedListeners) {
        set((state) => ({
          __storedListeners: [
            ...state.__storedListeners,
            { ...listener, lastSeen: new Date(listener.lastSeen) },
          ],
        }));
      }
    },
    getRepos: () => {
      const repos = get().__dbRepos;
      if (repos) return repos;
      throw new Error("dbRepos not set");
    },

    onRemoteRespondToAdvertise: (payload, rinfo) => {
      //	If it hasn't been discovered nor is listening to it, add it to the discover list
      const isListening = get()
        .getRoomsListeningTo()
        .find((x) => x.appId === payload.appId);
      if (isListening) return;
      const hasDiscovered = get()
        .getRoomsToDiscover()
        .findIndex((x) => x.appId === payload.appId);
      if (hasDiscovered === -1) {
        set((state) => {
          state.__roomsToDiscover.splice(hasDiscovered, 1, {
            ...payload,
            port: rinfo.port,
            address: rinfo.address,
          });
          return state;
        });
      }
    },
    onRemoteBroadcastStop: (payload) => {
      set((state) => {
        // All devices check if it is on the discovery list and deletes it
        let emitter = state.__roomsToDiscover.findIndex(
          (x) => x.appId === payload.appId
        );
        if (emitter !== -1) {
          state.__roomsToDiscover.splice(emitter, 1);
          return state;
        }
        //	and set the emitter to disconnected
        emitter = state.__roomsListeningTo.findIndex(
          (x) => x.appId === payload.appId
        );
        if (emitter !== -1) {
          state.__roomsListeningTo.splice(emitter, 1, {
            ...state.__roomsListeningTo[emitter],
            disconnected: true,
            needsAssist: false,
          });
        }

        return state;
      });
    },
    onStartListening: (appId) => {
      const discoverRoom = get()
        .getRoomsToDiscover()
        .find((x) => x.appId === appId);
      if (discoverRoom) {
        set((state) => {
          state.__roomsToDiscover = state.__roomsToDiscover.filter(
            (x) => x.appId !== discoverRoom.appId
          );
          state.__roomsListeningTo.push({
            ...discoverRoom,
            disconnected: false,
            needsAssist: false,
          });
          return state;
        });
      }
      return discoverRoom;
    },
    onReceiverListening: (payload, rinfo) => {
      set((state) => ({
        ...state,
        currentListeners: [
          ...state.__currentListeners,
          { ...payload, port: rinfo.port, address: rinfo.address },
        ],
      }));
    },
    onRemoteNotListening: (payload) => {
      // To check if this is valid response
      set((state) => ({
        ...state,
        roomsListeningTo: state.__roomsListeningTo.filter(
          (x) => x.appId !== payload.appId
        ),
      }));
    },
    onEmitterRequestHelp: (payload) => {
      const emitter = get().__roomsListeningTo.findIndex(
        (x) => x.appId === payload.appId
      );
      if (emitter !== -1) {
        set((state) => {
          state.__roomsListeningTo.splice(emitter, 1, {
            ...state.__roomsListeningTo[emitter],
            needsAssist: true,
          });
          return state;
        });
      }
    },
    onEmitterStopsHelpRequest: (payload) => {
      const emitter = get()
        .getRoomsListeningTo()
        .find((x) => x.appId === payload.appId);
      if (emitter) {
        set((state) => ({
          __roomsListeningTo: [
            ...state.__roomsListeningTo,
            {
              ...emitter,
              needsAssist: false,
            },
          ],
        }));
      }
    },
    updateIncomingResponder: (payload) => {
      set(() => ({ __incomingResponder: payload.responderName }));
    },
    onInvalidMessage: (payload) => {
      //	Handle invalid events
      //	That would never happen in a managed app, this is just in case.
      //	Probably later add a error toast.
      console.log(`[Invalid schema]: ${payload}`);
    },
    onRemoteStatusResponse: (payload, rinfo) => {
      set((state) => {
        // 	On this device.
        //	If it is someone this device listens to, connect it again
        const listeningTo = get()
          .getRoomsListeningTo()
          .findIndex((x) => x.appId === payload.appId);
        if (listeningTo !== -1) {
          state.__roomsListeningTo[listeningTo] = {
            ...state.__roomsListeningTo[listeningTo],
            disconnected: false,
          };

          //	Update that device last status so it wont be removed on next check
          const device = get().__scheduledToCheck.get(payload.appId);
          if (device) {
            state.__scheduledToCheck.set(payload.appId, {
              ...device,
              lastPing: Date.now(),
            });
          }
          return state;
        }

        //	Update last ping status
        state.__scheduledToCheck.set(payload.appId, {
          lastPing: Date.now(),
          port: rinfo.port,
          address: rinfo.address,
        });

        return state;
      });
    },
    onDeviceCleanUp: (appId) => {
      set((state) => {
        // On discovered devices, delete it
        let device = state
          .getRoomsToDiscover()
          .findIndex((x) => x.appId === appId);
        if (device !== -1) {
          state.__roomsToDiscover.splice(device, 1);
        }

        // On listening devices, disconnect it
        device = state
          .getRoomsListeningTo()
          .findIndex((x) => x.appId === appId);
        if (device !== -1) {
          state.getRoomsListeningTo().splice(device, 1, {
            ...state.getRoomsListeningTo()[device],
            disconnected: true,
            needsAssist: false,
          });
          return state;
        }

        // On current listeners delete it
        device = state
          .getCurrentListeners()
          .findIndex((x) => x.appId === appId);
        if (device !== -1) state.__currentListeners.splice(device, 1);

        return state;
      });
    },

    getMergedRooms: () => {
      return [
        ...get()
          .getCurrentListeners()
          .map<IRoomData>(({ responderName, ...room }) => room),
        ...get()
          .getRoomsListeningTo()
          .map<IRoomData>((x) => ({
            address: x.address,
            appId: x.appId,
            port: x.port,
          })),
        ...get()
          .getRoomsToDiscover()
          .map<IRoomData>((x) => ({
            address: x.address,
            appId: x.appId,
            port: x.port,
          })),
      ];
    },

    sendDiscovery: () => get().getAdapter().sendDiscovery(),
    //  Room receiver methods

    addToListeningTo: async (appId) => {
      const discoveryRoom = get().onStartListening(appId);
      if (!discoveryRoom)
        return console.log("[RoomStore] No emitter in discovery room");
      await get().__notifyEmitterThisDeviceIsListening(discoveryRoom);
    },
    __notifyEmitterThisDeviceIsListening: async (room) => {
      get()
        .getAdapter()
        .sendTo(room.port, room.address, {
          event: RoomEventLiteral.Listening,
          appId: await get().getAppId(),
          responderName: await get().getCurrentName(),
        });
    },
    respondToHelp: async (appId) => {
      const emitter = get()
        .getRoomsListeningTo()
        .find((x) => x.appId === appId);
      if (!emitter || emitter.disconnected) return;
      get()
        .getAdapter()
        .sendTo(emitter.port, emitter.address, {
          event: RoomEventLiteral.RespondToHelp,
          responderName: await get().getCurrentName(),
        });
    },
    deleteListeningTo: async (appId) => {
      const listeningTo = get()
        .getRoomsListeningTo()
        .find((x) => x.appId === appId);
      if (listeningTo) {
        get().onRemoteNotListening({ appId });
        get()
          .getAdapter()
          .sendTo(listeningTo.port, listeningTo.address, {
            event: RoomEventLiteral.NotListening,
            appId: await get().getAppId(),
          });
      }
    },

    //  Room emitter methods
    getIncomingResponder: () => get().__incomingResponder,
    getCurrentListeners: () => get().__currentListeners,
    requestHelp: get().getAdapter().requestHelp,
  });
