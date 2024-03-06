import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";

export interface ProcessListProps {
  processes: ProcessProps[];
  addOrUpdateProcess: (process: ProcessProps) => Promise<void>;
  deleteProcess: (id: string) => Promise<void>;
}

export interface ProcessProps {
  id: string,
  status: string,
  name: string,
  type: string,
  progress: number
  total: number
  percentage: number
}

export const useProcessListStore = create(persist<ProcessListProps>(
  (set) => ({
    processes: [],
    addOrUpdateProcess: async (process: ProcessProps) => set((state) => {
      let newArray = state.processes.map(x => x);
      const existingProcessId = state.processes.findIndex(filter => filter.id === process.id);
      if (existingProcessId != -1) {
        newArray[existingProcessId] = process
      } else {
        newArray.push(process)
      }
      return { ...state, processes: newArray }
    }),
    deleteProcess: async (id: string) => set((state) => {
      const newArray = state.processes.filter(filter => filter.id != id);      
      return { ...state, processes: newArray }
    }),
  }),
  {
    name: 'process-storage', // name of the item in the storage (must be unique)
    storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
  },
))

