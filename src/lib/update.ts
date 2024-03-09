import {invoke} from "@tauri-apps/api/core";
import {dirname, join} from "@tauri-apps/api/path";
import {useConfigStore} from "@/lib/store/config.ts";
import {ProcessProps, useProcessListStore} from "@/lib/store/process.ts";
import {ModFiles} from "@/lib/metadata.ts";
import {LocalFileMetadata, useAppStore} from "@/lib/store/app.ts";
import {cloneDeep} from "lodash";
import {toast} from "sonner";
import i18n from "i18next";

const executeCommand = async (file: ModFiles, 
                              command: (file: ModFiles, remote: string) => Promise<boolean>): Promise<boolean> => {
  const {mirrorGroup} = useConfigStore.getState()

  for (const item of mirrorGroup.remotes) {
    try {
      return await command(file, item.rcloneName)
    } catch (e) {
      console.error(e);
    }
  }
  return false
}

const copyFileCommand = async (file: ModFiles, remote: string) => {
  return await invoke<boolean>("rclone_command", {
    command: "copyto",
    remote: `${remote}`,
    remotePath: `${remote}:/${file.remotePath}`,
    targetPath: file.path,
    additionalFlags: "--delete-during --ignore-size --verbose --no-update-modtime --transfers 4 --checkers 8 --contimeout 60s --timeout 300s --retries 3 --low-level-retries 10 --stats 1s --stats-file-name-length 0 --fast-list",
    excludeItems: [],
    listenerId: "copy_file"
  });
}

const syncPsarcCommand = async (file: ModFiles, remote: string) => {
  const {rpcs3Path} = useConfigStore.getState()

  const rpcs3Directory = await dirname(rpcs3Path);
  const targetDirectory = await join(rpcs3Directory, ".moddedboost", file.remotePath)
  return await invoke<boolean>("rclone_command", {
    command: "sync",
    remote: `${remote}`,
    remotePath: `${remote}:/${file.remotePath}`,
    targetPath: targetDirectory,
    additionalFlags: "--delete-during --verbose --no-update-modtime --transfers 4 --checkers 8 --contimeout 60s --timeout 300s --retries 3 --low-level-retries 10 --stats 1s --stats-file-name-length 0 --fast-list",
    excludeItems: [],
    listenerId: "sync_psarc"
  });
}

export const refreshAllLocalMetadata = async (filePaths: string[], showToast: boolean) => {
  const {setLocalMetadata, setIsRefreshing} = useAppStore.getState()
  
  setIsRefreshing(true)
  let loadingToastId : string | number | undefined = undefined;
  if (showToast) {
    loadingToastId = toast.loading(i18n.t("Refreshing local files..."));
  }
  const realFileMetadata = await invoke<LocalFileMetadata[]>("get_file_metadata_command", {
    filePaths: filePaths
  })
  setLocalMetadata(realFileMetadata)
  if (loadingToastId) toast.dismiss(loadingToastId)
  if (showToast) toast.success(i18n.t("Refresh complete."));
  setIsRefreshing(false)
}

export const refreshLocalMetadata = async (filePath: string, showToast: boolean) => {
  const {isRefreshing, localMetadata, setLocalMetadata, setIsRefreshing} = useAppStore.getState()
  if (isRefreshing) return;
  
  setIsRefreshing(true)
  let loadingToastId : string | number | undefined = undefined;
  if (showToast) {
    loadingToastId = toast.loading(i18n.t("Refreshing local files..."));
  }
  const actualFilePaths = [filePath]
  const realFileMetadata = await invoke<LocalFileMetadata[]>("get_file_metadata_command", {
    filePaths: actualFilePaths
  })
  let newList = cloneDeep(localMetadata)
  const index = newList.findIndex(p => p.path === filePath);
  if (index !== -1) {
    // If the item exists in the array, update it
    newList[index] = {...realFileMetadata[0]};
  } else {
    // If the item does not exist in the array, add it
    newList = [...newList, ...realFileMetadata];
  }
  setLocalMetadata(newList)
  
  if (loadingToastId) toast.dismiss(loadingToastId)
  if (showToast) toast.success(i18n.t("Refresh complete."));
  
  setIsRefreshing(false)
}

export const updateFiles = async (fileProcess: ProcessProps, file: ModFiles) => {
  const {rpcs3Path} = useConfigStore.getState()
  const {addOrUpdateProcess} = useProcessListStore.getState();

  try {
    await addOrUpdateProcess({...fileProcess, status: "Started"})
    
    if (file.type === "file") {
      const executeResult = await executeCommand(file, copyFileCommand)
      if (executeResult) await refreshLocalMetadata(file.path, false)
    } else if (file.type === "psarc") {
      const rpcs3Directory = await dirname(rpcs3Path);
      const targetDirectory = await join(rpcs3Directory, ".moddedboost", file.remotePath)
      const psarcDestinationDirectory = await dirname(file.path)

      const executeResult = await executeCommand(file, syncPsarcCommand)
      if (executeResult) {
        await invoke("pack_psarc_command", {
          sourceDirectoryPath: targetDirectory,
          outputFileName: file.name,
          destinationDirectoryPath: psarcDestinationDirectory
        })
        await refreshLocalMetadata(file.path, false)
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    await addOrUpdateProcess({...fileProcess, status: "Finished"})
  }
};