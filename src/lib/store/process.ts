import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";

export enum ProgressType{
  Download,
  Copy,
  Install
}

export interface ProcessListProps {
  processList: ProcessProps[];
  addOrUpdateProcess: (process: ProcessProps) => void;
  removeProcess: (process: ProcessProps) => void;
  clearProcess: () => void;
}

export interface ProcessProps {
  id: number,
  status: string,
  name: string,
  type: ProgressType,
  progress: number
  total: number
  percentage: number
}

export const useProcessListStore = create(persist<ProcessListProps>(
  (set) => ({
    processList: [],
    addOrUpdateProcess: (process: ProcessProps) => set((state: { processList: ProcessProps[]; }) => {
      const index = state.processList.findIndex(item => item.id === process.id)
      let newList = [...state.processList];
      if (index === -1)
        newList.push(process)
      else
        newList[index] = process

      return { ...state, processList: newList }
    }),
    removeProcess: (process: ProcessProps) => set((state: {
      processList: ProcessProps[];
    }) => ({processList: state.processList.filter(x => x.id !== process.id)})),
    clearProcess: () => set(() => ({processList: []}))
  }),
  {
    name: 'process-storage', // name of the item in the storage (must be unique)
    storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
  },
))

