import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";

export interface ProcessListProps {
  processList: ProcessProps[];
  addOrUpdateProcess: (process: ProcessProps) => void;
  updateProcess: (index: number, process: ProcessProps) => void;
  updateProgress: (id: string, progress: number, total: number) => void;
  removeProcess: (process: ProcessProps) => void;
  clearProcess: () => void;
}

export interface ProcessProps {
  id: string,
  status: string,
  name: string,
  progress: number
  total: number
  percentage: number
}

export const useProcessListStore = create(persist<ProcessListProps>(
  (set) => ({
    processList: [],
    addOrUpdateProcess: (process: ProcessProps) => set((state: { processList: ProcessProps[]; }) => {
      const index = state.processList.findIndex(item => item.id == process.id)
      let newList = [...state.processList];
      if (index === -1)
        newList.push(process)
      else
        newList[index] = process

      return { ...state, processList: newList }
    }),
    updateProcess: (index: number, process: ProcessProps) => set((state: { processList: ProcessProps[]; }) => {
      state.processList[index] = process
      return {processList: state.processList};
    }),
    updateProgress: (id: string, progress: number, total: number) => set((state: { processList: ProcessProps[]; }) => {
      const process = state.processList.find(p => p.id === id)
      if (process) {
        process.progress += progress
        process.total = total
        process.percentage = (process.progress / process.total) * 100
      }
      return { processList: state.processList };
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

