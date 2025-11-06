import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import { createRoomStore, IRoomState } from "../src/index";

const TestStore = createStore<IRoomState>()(
  subscribeWithSelector(createRoomStore())
);

console.log(TestStore.getState());
