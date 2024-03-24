import {invoke} from "@tauri-apps/api/core";
import {dirname, join} from "@tauri-apps/api/path";
import {useConfigStore} from "@/lib/store/config.ts";
import {ProcessProps, useProcessListStore} from "@/lib/store/process.ts";
import {ModFiles} from "@/lib/metadata.ts";
import {refreshLocalMetadata} from "@/lib/refresh.ts";

const executeCommand = async (
  file: ModFiles, 
  command: (path: string, remotePath: string, remote: string) => Promise<boolean>
): Promise<boolean> => {
  const {mirrorGroup} = useConfigStore.getState()

  for (const item of mirrorGroup.remotes) {
    try {
      return await command(file.path, file.remotePath, item.rcloneName)
    } catch (e) {
      console.error(e);
    }
  }
  return false
}

export const copyFileCommand = async (path: string, remotePath: string, remote: string) => {
  return await invoke<boolean>("rclone_command", {
    command: "copyto",
    remote: `${remote}`,
    remotePath: `${remote}:/${remotePath}`,
    targetPath: path,
    additionalFlags: "--verbose --contimeout 60s --timeout 300s --retries 3 --low-level-retries 10 --stats 1s --stats-file-name-length 0 --fast-list",
    excludeItems: [],
    listenerId: "copy_file"
  });
}

export const syncPsarcCommand = async (path: string, remotePath: string, remote: string) => {
  console.debug(path)
  const {rpcs3Path} = useConfigStore.getState()

  const rpcs3Directory = await dirname(rpcs3Path);
  const targetDirectory = await join(rpcs3Directory, ".moddedboost", remotePath)
  return await invoke<boolean>("rclone_command", {
    command: "sync",
    remote: `${remote}`,
    remotePath: `${remote}:/${remotePath}`,
    targetPath: targetDirectory,
    additionalFlags: "--delete-during --verbose --transfers 4 --checkers 8 --contimeout 60s --timeout 300s --retries 3 --low-level-retries 10 --stats 1s --stats-file-name-length 0 --fast-list",
    excludeItems: [],
    listenerId: "sync_psarc"
  });
}

export const updateFiles = async (fileProcess: ProcessProps, file: ModFiles) => {
  const {rpcs3Path} = useConfigStore.getState()
  const {addOrUpdateProcess} = useProcessListStore.getState();

  try {
    await addOrUpdateProcess({...fileProcess, status: "Started"})
    
    if (file.type === "file") {
      const executeResult = await executeCommand(file, copyFileCommand)
      if (executeResult) await refreshLocalMetadata(file.path, true, false)
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
        await refreshLocalMetadata(file.path, true, false)
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    await addOrUpdateProcess({...fileProcess, status: "Finished"})
  }
};