import {createWithEqualityFn} from "zustand/traditional";
import {Metadata} from "@/lib/metadata.ts";
import {Update} from "@tauri-apps/plugin-updater";

export type LocalFileMetadata = {
  path: string,
  checksum: string,
  lastModified: number,
}

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

  openUpdateModal: boolean;
  updateInfo: Update | null;
  setOpenUpdateModal: (update: Update | null) => void;
  
  loadedMetadata: Metadata | undefined,
  setLoadedMetadata: (metadata: Metadata) => void;

  localMetadata: LocalFileMetadata[],
  setLocalMetadata: (metadata: LocalFileMetadata[]) => void;

  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;
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
  },

  openUpdateModal: false,
  updateInfo: null,
  setOpenUpdateModal(update: Update | null) {
    set({openUpdateModal: update?.available ?? false, updateInfo: update})
  },
  
  loadedMetadata: undefined,
  setLoadedMetadata(metadata) {
    set({loadedMetadata: metadata})
  },

  localMetadata: [],
  setLocalMetadata(localMetadata) {
    set({localMetadata: localMetadata})
  },
  
  isRefreshing: false,
  setIsRefreshing(refreshing) {
    set({isRefreshing: refreshing})
  }
}));

