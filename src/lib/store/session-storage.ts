import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";
import {GameVersions} from "@/lib/metadata.ts";

type BaseFolderLastChecked = {
  gameId: GameVersions,
  timestamp: EpochTimeStamp
}

export interface SessionStorageProps {
  baseFolderLastChecked: BaseFolderLastChecked[];
  setBaseFolderLastChecked: (gameId: GameVersions, epochTimeStamp: number) => Promise<void>;
}

export const useSessionStorage = create(persist<SessionStorageProps>(
  (set) => ({
    baseFolderLastChecked: [{gameId: "NPJB00512", timestamp: 0}, {gameId: "BLJS10250", timestamp: 0}],
    setBaseFolderLastChecked: async (gameId: GameVersions, epochTimeStamp: number) => set((state) => {
      let newArray = state.baseFolderLastChecked.map(x => x);
      const lastChecked = {gameId: gameId, timestamp: epochTimeStamp};
      const existingProcessId = state.baseFolderLastChecked.findIndex(filter => filter.gameId === gameId);
      if (existingProcessId != -1) {
        newArray[existingProcessId] = lastChecked
      } else {
        newArray.push(lastChecked)
      }

      return {...state, baseFolderLastChecked: newArray}
    })
  }),
  {
    name: 'session-storage', // name of the item in the storage (must be unique)
    storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
  },
))

