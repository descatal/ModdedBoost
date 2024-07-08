import {invoke} from "@tauri-apps/api/core";
import {useAppStore} from "@/lib/store/app.ts";

const REGEX_CHINESE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;

export async function checkRpcs3Validity(rpcs3Path: string): Promise<boolean> {
  const {setOpenRunningProcessModal, setOpenInvalidPathModal} = useAppStore.getState()

  const hasChineseCharacters = rpcs3Path.match(REGEX_CHINESE);
  if (hasChineseCharacters) {
    setOpenInvalidPathModal(true)
    return false;
  } else {
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
}

export async function checkRpcs3Initialized(rpcs3Path: string): Promise<boolean> {
  return await invoke("check_initialized", {fullPath: rpcs3Path})
}

