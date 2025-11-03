import { StateCreator } from 'zustand/vanilla';

import { IAssistanceRoomClientSlice, IRoomEmitterSlice, IRoomReceiverSlice } from './Room.state';
import { ConnMethod, RoomEventLiteral, RoomServiceStatus } from '../schemas/RoomEvent.schema';
import { IRoomData } from '../types/room.context';
import { UdpSocketClient } from '../udp-client/UDPClient';

export type IRoomState = IAssistanceRoomClientSlice & IRoomEmitterSlice & IRoomReceiverSlice;

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
export const createRoomStore = (): StateCreator<IRoomState, [], [], IRoomState> => (set, get) => ({
  connMethod: ConnMethod.None,
  connAdapter: null,
  status: RoomServiceStatus.Down,
  currentAppId: null,
  currentName: null,
  currentDevice: null,
  scheduledToCheck: new Map(),
  dbRepos: null,

  //  Room receiver values
  roomsListeningTo: [],
  roomsToDiscover: [],
  storedListeners: [],

  //  Room emitter values
  currentListeners: [],
  incomingResponder: null,

  updateConnectionMethod: (connMethod, connAdapter) => {
    set({ connMethod, connAdapter });
  },
  getAppId: () => {
    const appId = get().currentAppId;
    if (appId) return appId;
    throw new Error('NoAppId');
  },
  getCurrentName: () => {
    const name = get().currentName;
    if (name) return name;
    throw new Error('NoName');
  },
  getAdapter: () => {
    const adapter = get().connAdapter;
    if (!adapter) {
      console.log('[RoomStore] No adapter');
      throw new Error('NoAdapter');
    }
    return adapter;
  },
  updateMemoryState: (k, v) => set({ [k]: v }),
  __syncDatabase: async (dbRepos) => {
    set({ dbRepos });
    const storedListeners = await get().getRepos().ListeningTo.get();
    if (!storedListeners.length) return;
    for (const listener of storedListeners) {
      set((state) => ({
        storedListeners: [...state.storedListeners, listener],
      }));
    }
  },
  getRepos: () => {
    const repos = get().dbRepos;
    if (repos) return repos;
    throw new Error('dbRepos not set');
  },
  getStoredListeners: async () => {},

  onRemoteRespondToAdvertise: (payload, rinfo) => {
    //	If it hasn't been discovered nor is listening to it, add it to the discover list
    const isListening = get().roomsListeningTo.find((x) => x.appId === payload.appId);
    if (isListening) return;
    const hasDiscovered = get().roomsToDiscover.findIndex((x) => x.appId === payload.appId);
    if (hasDiscovered === -1) {
      set((state) => {
        state.roomsToDiscover.splice(hasDiscovered, 1, {
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
      let emitter = state.roomsToDiscover.findIndex((x) => x.appId === payload.appId);
      if (emitter !== -1) {
        state.roomsToDiscover.splice(emitter, 1);
        return state;
      }
      //	and set the emitter to disconnected
      emitter = state.roomsListeningTo.findIndex((x) => x.appId === payload.appId);
      if (emitter !== -1) {
        state.roomsListeningTo.splice(emitter, 1, {
          ...state.roomsListeningTo[emitter],
          disconnected: true,
          needsAssist: false,
        });
      }

      return state;
    });
  },
  onStartListening: (appId) => {
    // On the receiver end, before sending "listening" to the emitter
    // add it to roomsListeningTo and delete it from roomsToDiscover
    const discoverRoom = get().roomsToDiscover.find((x) => x.appId === appId);
    if (discoverRoom) {
      set((state) => {
        state.roomsToDiscover = state.roomsToDiscover.filter((x) => x.appId !== discoverRoom.appId);
        state.roomsListeningTo.push({ ...discoverRoom, disconnected: false, needsAssist: false });
        return state;
      });
    }
    // Returns wether it exists or not in roomsToDiscover
    return discoverRoom;
  },
  onReceiverListening: (payload, rinfo) => {
    // The emitter keeps track of the receiver listening to him
    set((state) => ({
      ...state,
      currentListeners: [
        ...state.currentListeners,
        { ...payload, port: rinfo.port, address: rinfo.address },
      ],
    }));
  },
  onRemoteNotListening: (payload) => {
    // To check if this is valid response
    set((state) => ({
      ...state,
      roomsListeningTo: state.roomsListeningTo.filter((x) => x.appId !== payload.appId),
    }));
  },
  onEmitterRequestHelp: (payload) => {
    //	From the receiver end, set the emitter to needing assist
    const emitter = get().roomsListeningTo.findIndex((x) => x.appId === payload.appId);
    if (emitter !== -1) {
      set((state) => {
        state.roomsListeningTo.splice(emitter, 1, {
          ...state.roomsListeningTo[emitter],
          needsAssist: true,
        });
        return state;
      });
    }
  },
  onEmitterStopsHelpRequest: (payload) => {
    //	From the receiver end, set the emitter to not needing assist anymore
    const emitter = get().roomsListeningTo.find((x) => x.appId === payload.appId);
    if (emitter) {
      set((state) => ({
        roomsListeningTo: [
          ...state.roomsListeningTo,
          {
            ...emitter,
            needsAssist: false,
          },
        ],
      }));
    }
  },
  updateIncomingResponder: (payload) => {
    //	From the emitter end, set the incoming responder
    set(() => ({ incomingResponder: payload.responderName }));
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
      const listeningTo = get().roomsListeningTo.findIndex((x) => x.appId === payload.appId);
      if (listeningTo !== -1) {
        state.roomsListeningTo[listeningTo] = {
          ...state.roomsListeningTo[listeningTo],
          disconnected: false,
        };

        //	Update that device last status so it wont be removed on next check
        const device = get().scheduledToCheck.get(payload.appId);
        if (device) {
          state.scheduledToCheck.set(payload.appId, {
            ...device,
            lastPing: Date.now(),
          });
        }
        return state;
      }

      //	Update last ping status
      state.scheduledToCheck.set(payload.appId, {
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
      let device = state.roomsToDiscover.findIndex((x) => x.appId === appId);
      if (device !== -1) {
        state.roomsToDiscover.splice(device, 1);
      }

      // On listening devices, disconnect it
      device = state.roomsListeningTo.findIndex((x) => x.appId === appId);
      if (device !== -1) {
        state.roomsListeningTo.splice(device, 1, {
          ...state.roomsListeningTo[device],
          disconnected: true,
          needsAssist: false,
        });
        return state;
      }

      // On current listeners delete it
      device = state.currentListeners.findIndex((x) => x.appId === appId);
      if (device !== -1) state.currentListeners.splice(device, 1);

      return state;
    });
  },

  getMergedRooms: () => {
    return [
      ...get().currentListeners.map<IRoomData>(({ responderName, ...room }) => room),
      ...get().roomsListeningTo.map<IRoomData>((x) => ({
        address: x.address,
        appId: x.appId,
        port: x.port,
      })),
      ...get().roomsToDiscover.map<IRoomData>((x) => ({
        address: x.address,
        appId: x.appId,
        port: x.port,
      })),
    ];
  },

  sendDiscovery: () => get().getAdapter().sendDiscovery(),
  //  Room receiver methods

  addToListeningTo: (appId) => {
    const discoveryRoom = get().onStartListening(appId);
    if (!discoveryRoom) return console.log('[RoomStore] No emitter in discovery room');
    get().notifyEmitterThisDeviceIsListening(discoveryRoom);
  },
  notifyEmitterThisDeviceIsListening: (room) => {
    get().connAdapter?.sendTo(room.port, room.address, {
      event: RoomEventLiteral.Listening,
      appId: get().getAppId(),
      responderName: get().getCurrentName(),
    });
  },
  respondToHelp: (appId) => {
    const emitter = get().roomsListeningTo.find((x) => x.appId === appId);
    if (!emitter || emitter.disconnected) return;
    get().getAdapter().sendTo(emitter.port, emitter.address, {
      event: RoomEventLiteral.RespondToHelp,
      responderName: get().getCurrentName(),
    });
  },
  deleteListeningTo: (appId) => {
    const listeningTo = get().roomsListeningTo.find((x) => x.appId === appId);
    if (listeningTo) {
      get().onRemoteNotListening({ appId });
      get().getAdapter().sendTo(listeningTo.port, listeningTo.address, {
        event: RoomEventLiteral.NotListening,
        appId: get().getAppId(),
      });
    }
  },

  //  Room emitter methods
  requestHelp: () => get().getAdapter().requestHelp,
});
