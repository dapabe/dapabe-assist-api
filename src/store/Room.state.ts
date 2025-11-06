import { DatabaseService } from "../database/DatabaseService";
import { IListeningToDTO } from "../schemas/ListeningTo.schema";
import {
  IConnAdapter,
  IConnMethod,
  IRoomServiceStatus,
  RoomEventLiteral,
} from "../schemas/RoomEvent.schema";
import { UUID } from "../types/common";
import {
  FromSocketUnion,
  IRoomData,
  IRoomListener,
  IWSRoom,
  IWSRoomListener,
  RemoteUDPInfo,
} from "../types/room.context";

type InMemoryStateKey = "__status" | "currentDevice";

type InMemoryStateMap = {
  /**
   *  [INTERNAL] \
   *  Controls socket service availability
   */
  __status: IRoomServiceStatus;
  currentDevice: string | null;
};

export type IAssistanceRoomClientSlice = InMemoryStateMap & {
  connMethod: IConnMethod;
  connAdapter: IConnAdapter;
  updateMemoryState: <K extends InMemoryStateKey>(
    k: K,
    v: InMemoryStateMap[K]
  ) => void;
  updateConnectionMethod: (c: IConnMethod, a: IConnAdapter) => void;
  getAppId: () => Promise<string>;
  getCurrentName: () => Promise<string>;
  getCurrentDevice: () => string | null;
  getAdapter: () => NonNullable<IConnAdapter>;

  /**
   * Check if they are ok, if not delete them or set to disconnect
   * the value is the epochTimestamp
   */
  scheduledToCheck: Map<
    UUID,
    {
      lastPing: number;
      port: number;
      address: string;
    }
  >;
  __dbRepos: DatabaseService["Repo"] | null;
  __syncDatabase: (repos: DatabaseService["Repo"]) => Promise<void>;
  getRepos: () => DatabaseService["Repo"];

  /**	Iterates over all existing devices */
  getMergedRooms: () => IRoomData[];

  onRemoteRespondToAdvertise: (
    payload: FromSocketUnion<typeof RoomEventLiteral.RespondToAdvertise>,
    rinfo: RemoteUDPInfo
  ) => void;
  onRemoteBroadcastStop: (
    payload: FromSocketUnion<typeof RoomEventLiteral.BroadcastStop>
  ) => void;
  /**
   *  On the receiver end, before sending "listening" to the emitter \
   *  add it to roomsListeningTo and delete it from roomsToDiscover
   *  @returns Wether it exists or not in `roomsToDiscover`
   */
  onStartListening: (appId: UUID) => IWSRoom | undefined;
  /** The emitter keeps track of the receiver listening to him */
  onReceiverListening: (
    payload: FromSocketUnion<typeof RoomEventLiteral.Listening>,
    rinfo: RemoteUDPInfo
  ) => void;
  /** From the receiver end, if the emitter is not available */
  onRemoteNotListening: (
    payload: FromSocketUnion<typeof RoomEventLiteral.NotListening>
  ) => void;
  /** From the receiver end, set the emitter to needing assist */
  onEmitterRequestHelp: (
    payload: FromSocketUnion<typeof RoomEventLiteral.RequestHelp>
  ) => void;
  /** From the receiver end, set the emitter to not needing assist anymore */
  onEmitterStopsHelpRequest: (
    payload: FromSocketUnion<typeof RoomEventLiteral.RequestStop>
  ) => void;
  /** From the emitter end, set the incoming responder */
  updateIncomingResponder: (
    payload: FromSocketUnion<typeof RoomEventLiteral.RespondToHelp>
  ) => void;
  onInvalidMessage: (
    payload: FromSocketUnion<typeof RoomEventLiteral.Invalid>
  ) => void;
  onRemoteStatusResponse: (
    payload: FromSocketUnion<typeof RoomEventLiteral.ImOkay>,
    rinfo: RemoteUDPInfo
  ) => void;
  onDeviceCleanUp: (appId: UUID) => void;
  sendDiscovery(): AsyncGenerator<{ counter: number; done: boolean }>;
};

export type IRoomEmitterSlice = {
  incomingResponder: string | null;
  currentListeners: IRoomListener[];
  requestHelp: () => Promise<void>;
};

export type IRoomReceiverSlice = {
  roomsToDiscover: IWSRoom[];
  roomsListeningTo: IWSRoomListener[];
  storedListeners: Omit<IListeningToDTO["Read"], "appId">[];
  getStoredListeners: () => Omit<IListeningToDTO["Read"], "appId">[];
  __notifyEmitterThisDeviceIsListening: (room: IWSRoom) => Promise<void>;
  respondToHelp: (appId: UUID) => Promise<void>;
  addToListeningTo: (appId: UUID) => Promise<void>;
  deleteListeningTo: (appId: UUID) => Promise<void>;
};
