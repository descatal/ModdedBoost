import {invoke} from "@tauri-apps/api/core";
import {useAppStore} from "@/lib/store/app.ts";


export async function CheckRpcs3Validity(rpcs3Path: string): Promise<boolean> {
  const {setOpenRunningProcessModal} = useAppStore.getState()
  const validExecutable: boolean = await invoke("validate_rpcs3_executable", {fullPath: rpcs3Path})
  
  // If the executable can't be ran to check its validity, it might be caused by another instance of rpcs3 running
  if (!validExecutable) {
    const isRunning: boolean = await invoke("check_rpcs3_running")
    
    // On running, show the modal to let user turn off the process and retry again
    if (isRunning) {
      setOpenRunningProcessModal(true)
    }
  }
  
  return validExecutable
}

export async function CheckRpcs3Initialized(rpcs3Path: string): Promise<boolean> {
  return await invoke("check_initialized", {fullPath: rpcs3Path})
}

