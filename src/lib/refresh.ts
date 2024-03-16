import {invoke} from "@tauri-apps/api/core";
import {LocalFileMetadata, useAppStore} from "@/lib/store/app.ts";
import {cloneDeep} from "lodash";
import {toast} from "sonner";
import i18n from "i18next";

export const refreshLocalMetadataList = async (filePaths: string[], ignoreModtime: boolean, showToast: boolean) => {
  const {setLocalMetadata, setIsRefreshing} = useAppStore.getState()
  
  setIsRefreshing(true)
  let loadingToastId : string | number | undefined = undefined;
  if (showToast) {
    loadingToastId = toast.loading(i18n.t("Refreshing local files..."));
  }
  const realFileMetadata = await invoke<LocalFileMetadata[]>("get_file_metadata_command", {
    filePaths: filePaths,
    ignoreModtime: ignoreModtime,
  })
  setLocalMetadata(realFileMetadata)
  if (loadingToastId) toast.dismiss(loadingToastId)
  if (showToast) toast.success(i18n.t("Refresh complete."));
  setIsRefreshing(false)
}

export const refreshLocalMetadata = async (filePath: string, ignoreModtime: boolean, showToast: boolean) => {
  const {isRefreshing, localMetadata, setLocalMetadata, setIsRefreshing} = useAppStore.getState()
  if (isRefreshing) return;
  
  setIsRefreshing(true)
  let loadingToastId : string | number | undefined = undefined;
  if (showToast) {
    loadingToastId = toast.loading(i18n.t("Refreshing local files..."));
  }
  const actualFilePaths = [filePath]
  const realFileMetadata = await invoke<LocalFileMetadata[]>("get_file_metadata_command", {
    filePaths: actualFilePaths,
    ignoreModtime: ignoreModtime
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