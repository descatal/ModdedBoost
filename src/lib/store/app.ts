import {createWithEqualityFn} from "zustand/traditional";

export interface AppProps {
  isInitializing: boolean;
  setIsInitializing: (initializing: boolean) => void;
  openInitializeModal: boolean;
  setOpenInitializeModal: (open: boolean) => void;
  
  isProcessRunning: boolean;
  setIsProcessRunning: (running: boolean) => void;
  openRunningProcessModal: boolean;
  setOpenRunningProcessModal: (open: boolean) => void;

  openSelectRemoteModal: boolean;
  setOpenSelectRemoteModal: (open: boolean) => void;
}

export const useAppStore = createWithEqualityFn<AppProps>()((set) => ({
  isInitializing: false,
  setIsInitializing(initializing) {
    set({isInitializing: initializing})
  }, 
  openInitializeModal: false,
  setOpenInitializeModal(open) {
    set({openInitializeModal: open})
  },

  isProcessRunning: false,
  setIsProcessRunning(running) {
    set({isProcessRunning: running})
  },
  openRunningProcessModal: false,
  setOpenRunningProcessModal(open) {
    set({openRunningProcessModal: open})
  },

  openSelectRemoteModal: false,
  setOpenSelectRemoteModal(open) {
    set({openSelectRemoteModal: open})
  }
}));

