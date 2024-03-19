import {Card} from "@/components/ui/card.tsx";
import {FileIcon, RocketIcon, UpdateIcon,} from "@radix-ui/react-icons";
import {Label} from "@/components/ui/label.tsx";
import {useTranslation} from "react-i18next";
import {Dispatch, SetStateAction, useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api/core";
import {GameVersions, Metadata, transformPaths} from "@/lib/metadata.ts";
import {dirname, join} from "@tauri-apps/api/path";
import FilesDialog from "@/components/dialogs/files/files-dialog.tsx";
import IconButton from "@/components/common/icon-button.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {useConfigStore} from "@/lib/store/config.ts";
import {VscFoldUp} from "react-icons/vsc";
import {ProcessProps, useProcessListStore} from "@/lib/store/process.ts";
import {cloneDeep, isEqual} from "lodash";
import {useSessionStorage} from "@/lib/store/session-storage.ts";
import {toast} from "sonner";
import i18n from "i18next";
import {LocalFileMetadata, useAppStore} from "@/lib/store/app.ts";
import {refreshLocalMetadataList} from "@/lib/refresh.ts";
import {copyFileCommand} from "@/lib/update.ts";

type ConfigProps = {
  gameId: GameVersions,
  metadata: Metadata
}

function GameTabs({gameId, metadata}: ConfigProps) {
  const baseFolderSyncProcessId = `base_folder_sync_${gameId}`;
  const baseFolderCheckProcessId = `base_folder_check_${gameId}`;
  const patchActivationCheckProcessId = `patch_activation_check_${gameId}`;
  const patchActivateProcessId = `patch_activate_${gameId}`;
  const defaultCheckProcess: ProcessProps = {
    id: "",
    status: "Finished",
    name: "",
    type: "Check",
    progress: 0,
    total: 0,
    percentage: 0
  }
  const {t} = useTranslation();
  const {processes, addOrUpdateProcess} = useProcessListStore();
  const {rpcs3Path, mirrorGroup} = useConfigStore.getState()
  const {isModFilesOutdated, localMetadata, setIsModFilesOutdated, setOpenRunningProcessModal, setOpenInvalidRapFileModal} = useAppStore()
  const {baseFolderLastChecked, setBaseFolderLastChecked} = useSessionStorage();
  const [baseFolderSyncProcess, setBaseFolderSyncProcess] = useState({...defaultCheckProcess, id: baseFolderSyncProcessId, name: baseFolderSyncProcessId})
  const [baseFolderCheckProcess, setBaseFolderCheckProcess] = useState({...defaultCheckProcess, id: baseFolderCheckProcessId, name: baseFolderCheckProcessId})
  const [patchActivationCheckProcess, setPatchActivationCheckProcess] = useState({...defaultCheckProcess, id: patchActivationCheckProcessId, name: patchActivationCheckProcessId})
  const [patchActivateProcess, setPatchActivateProcess] = useState({...defaultCheckProcess, id: patchActivateProcessId, name: patchActivateProcessId})
  const [isBaseFolderOutdated, setIsBaseFolderOutdated] = useState(false)
  const [isPatchActivated, setIsPatchActivated] = useState(false)
  const [isCheckingBaseFolder, setIsCheckingBaseFolder] = useState(false)
  const [isCheckingPatchActivation, setIsCheckingPatchActivation] = useState(false)
  const [isSyncingBaseFolder, setIsSyncingBaseFolder] = useState(false)
  const [isActivatingPatch, setIsActivatingPatch] = useState(false)
  const [isLaunchingGame, setIsLaunchingGame] = useState(false)
  const [gameMetadata, setGameMetadata] = useState<Metadata | undefined>()
  
  const launchGame = async (rpcs3Path: string, gameId: "BLJS10250" | "NPJB00512") => {
    if (gameId === "NPJB00512") {
      const rpcs3Directory = await dirname(rpcs3Path)
      const rapFilePath = await join(rpcs3Directory, "dev_hdd0", "home", "00000001", "exdata", "JP0700-NPJB00512_00-FULLBOOST000100A.rap")
      await invoke<LocalFileMetadata[]>("get_file_metadata_command", {
        filePaths: [rapFilePath],
        ignoreModtime: true,
      }).then(rapFileMetadata => {
        console.log(rapFileMetadata[0].checksum)
        if (!rapFileMetadata.length || rapFileMetadata[0].checksum != "4c266afc905455958a38a9c5c8590634") {
          setOpenInvalidRapFileModal(true)
        }
      }).catch(err => {
        console.error(err)
        setOpenInvalidRapFileModal(true)
      })
    }
    
    const isRpcs3Running = await invoke("check_rpcs3_running")
    if (isRpcs3Running) {
      setOpenRunningProcessModal(true)
    } else {
      setIsLaunchingGame(true)
      await invoke("launch_game", {
        fullPath: rpcs3Path,
        gameType: gameId,
      });
      setIsLaunchingGame(false)
    }
  };

  const checkBaseFolder = async () => {
    const runCommand = async (remote: string) => {
      const isSync = await invoke<boolean>("rclone_command", {
        command: "check",
        remote: `${remote}`,
        remotePath: `${remote}:/${gameMetadata!.base.remotePath}`,
        targetPath: gameMetadata!.base.path,
        additionalFlags: "--fast-list",
        excludeItems: gameMetadata!.base.excludePaths,
        listenerId: "check_base_folder"
      });

      const isDlcSync = await invoke<boolean>("rclone_command", {
        command: "check",
        remote: `${remote}`,
        remotePath: `${remote}:/${gameMetadata!.base.dlcRemotePath}`,
        targetPath: gameMetadata!.base.dlcPath,
        additionalFlags: "--fast-list",
        excludeItems: [],
        listenerId: "check_base_folder_dlc"
      });
      
      return isSync && isDlcSync;
    }

    await runProcessCommand(
      runCommand,
      true,
      i18n.t("Validating base folder..."),
      i18n.t("Base folder validation complete."),
      baseFolderCheckProcess,
      setBaseFolderLastChecked,
      setIsBaseFolderOutdated)
  };
  
  const syncBaseFolder = async () => {
    const runCommand = async (remote: string) => {
      const syncBaseSuccessful = await invoke<boolean>("rclone_command", {
        command: "sync",
        remote: `${remote}`,
        remotePath: `${remote}:/${gameMetadata!.base.remotePath}`,
        targetPath: gameMetadata!.base.path,
        additionalFlags: "--delete-during --ignore-size --verbose --transfers 4 --checkers 8 --contimeout 60s --timeout 300s --retries 3 --low-level-retries 10 --stats 1s --stats-file-name-length 0 --fast-list",
        excludeItems: gameMetadata!.base.excludePaths,
        listenerId: "sync_base_folder"
      });

      const syncDlcSuccessful = await invoke<boolean>("rclone_command", {
        command: "sync",
        remote: `${remote}`,
        remotePath: `${remote}:/${gameMetadata!.base.dlcRemotePath}`,
        targetPath: gameMetadata!.base.dlcPath,
        additionalFlags: "--delete-during --ignore-size --verbose --transfers 4 --checkers 8 --contimeout 60s --timeout 300s --retries 3 --low-level-retries 10 --stats 1s --stats-file-name-length 0 --fast-list",
        excludeItems: gameMetadata!.base.excludePaths,
        listenerId: "sync_base_folder"
      });
      
      return syncBaseSuccessful && syncDlcSuccessful
    }

    await runProcessCommand(
      runCommand,
      true,
      i18n.t("Starting base folder sync..."),
      i18n.t("Base folder sync complete."),
      baseFolderSyncProcess,
      setBaseFolderLastChecked,
      setIsBaseFolderOutdated)
  };

  const checkPatchActivation = async (showToast: boolean) => {
    const runCommand = async () => {
      const patchFileMd5 = await invoke<LocalFileMetadata[]>("get_file_metadata_command", {
        filePaths: [gameMetadata!.base.patchPath],
      });
      if (!(patchFileMd5[0]?.checksum ?? "" === gameMetadata!.base.patchMd5))
        return false;

      const rpcs3Dir = await dirname(rpcs3Path)
      const patchConfigPath = await join(rpcs3Dir, "config", "patch_config.yml");
      return await invoke<boolean>("check_patch_activated", {
        patchPath: patchConfigPath
      });
    }

    await runProcessCommand(
      runCommand,
      showToast,
      i18n.t("Checking patch file activation status..."),
      i18n.t("Patch file activation status check complete."),
      patchActivationCheckProcess,
      async () => {},
      setIsPatchActivated)
  }

  const activatePatch = async () => {
    const runCommand = async (remote: string) => {
      const patchFileMd5 = await invoke<LocalFileMetadata[]>("get_file_metadata_command", {
        filePaths: [gameMetadata!.base.patchPath],
      });
      if (!(patchFileMd5[0]?.checksum ?? "" === gameMetadata!.base.patchMd5)) {
        const copySuccessful = await copyFileCommand(gameMetadata!.base.patchPath, gameMetadata!.base.patchRemotePath, remote)
        if (!copySuccessful) return false;
      }
      
      const rpcs3Dir = await dirname(rpcs3Path)
      const patchConfigPath = await join(rpcs3Dir, "config", "patch_config.yml");
      const activationResult = await invoke<boolean>("activate_patch", {
        patchPath: patchConfigPath
      });
      
      if (!activationResult)
        toast.error(i18n.t("Activation failed. Please check config/patch_config.yml format."))
      
      return activationResult
    }

    await runProcessCommand(
      runCommand,
      true,
      i18n.t("Activating patch..."),
      i18n.t("Patch file activation complete."),
      patchActivateProcess,
      async () => {
        await checkPatchActivation(true)
      },
      setIsPatchActivated)
  }
  
  const runProcessCommand = async (
    command: (...args: any[]) => Promise<boolean>,
    showToast: boolean,
    loadingToastText: string,
    finishedToastText: string,
    process: ProcessProps,
    stateActionOnSuccess: (...args: any[]) => Promise<void>,
    postOperationStateAction: Dispatch<SetStateAction<boolean>>
  ) => {
    for (const item of mirrorGroup.remotes) {
      let loadingToastId: string | number = ""
      if (showToast) {
        loadingToastId = toast.loading(loadingToastText);
      }
      
      try {
        await addOrUpdateProcess({...process, status: "Started"})
        const commandResult = await command(item.rcloneName)
        if (commandResult) {
          await stateActionOnSuccess(gameId, new Date().getTime())
        }
        postOperationStateAction(!commandResult)
        break
      } catch (e) {
        console.error(e);
      } finally {
        if (showToast) {
          toast.dismiss(loadingToastId)
          toast.success(finishedToastText);
        }
        await addOrUpdateProcess({...process, status: "Finished"})
      }
    }
  }
  
  useEffect(() => {
    const convertPaths = async () => {
      const rpcs3Directory = await dirname(rpcs3Path)
      // Make a clone of the object as different game versions should have their own copy of their metadata.
      const result = await transformPaths(rpcs3Directory, cloneDeep(metadata), gameId);
      result.mod.files = result.mod.files.filter(map => map.versions.includes(gameId))
      setGameMetadata(result)

      const filePaths = result.mod.files.map(item=> item.path);
      await refreshLocalMetadataList(filePaths, false, false)
    }
    
    convertPaths().catch(console.error)
  }, [metadata])
  
  useEffect(() => {
    if (gameMetadata) {
      const lastCheckedTime = baseFolderLastChecked.find(item => item.gameId === gameId)
      const currentTime = new Date().getTime();
      const thresholdMs = 60 * 60 * 1000;
      if (!lastCheckedTime || (currentTime - lastCheckedTime.timestamp) > thresholdMs) {
        // Only execute check if the last check is 1 hour or more
        checkBaseFolder().catch(err => console.error(err));
      }
      checkPatchActivation(false).catch(err => console.error(err));
    }
  }, [gameMetadata])
  
  useEffect(() => {
    const checkOutdated = async () => {
      if (gameMetadata) {
        const allRemoteChecksum = gameMetadata.mod.files.map(item => item.md5).sort()
        const allLocalFilesChecksum = localMetadata.map(item => item.checksum).sort()
        const isInSync = (
          allRemoteChecksum.length === allLocalFilesChecksum.length
          && allRemoteChecksum.every((value, index) => value === allLocalFilesChecksum[index])
        )
        setIsModFilesOutdated(!isInSync)
      }
    }

    checkOutdated().catch(console.error)
  }, [localMetadata])

  useEffect(() => {
    parseProcess(
      baseFolderCheckProcessId, 
      baseFolderCheckProcess, 
      setIsCheckingBaseFolder, 
      setIsCheckingBaseFolder, 
      setBaseFolderCheckProcess)
    
    parseProcess(
      baseFolderSyncProcessId, 
      baseFolderSyncProcess, 
      setIsSyncingBaseFolder, 
      setIsSyncingBaseFolder, 
      setBaseFolderSyncProcess)

    parseProcess(
      patchActivationCheckProcessId,
      patchActivationCheckProcess,
      setIsCheckingPatchActivation,
      setIsCheckingPatchActivation,
      setPatchActivationCheckProcess)

    parseProcess(
      patchActivateProcessId,
      patchActivateProcess,
      setIsActivatingPatch,
      setIsActivatingPatch,
      setPatchActivateProcess)
  }, [processes])

  const parseProcess = (
    processId : string, 
    process: ProcessProps, 
    startStateAction: Dispatch<SetStateAction<boolean>>,
    endStateAction: Dispatch<SetStateAction<boolean>>,
    postProcessStateAction: Dispatch<SetStateAction<ProcessProps>>
  ) => {
    const newProcess = processes.find(process => process.id === processId)
    if (newProcess && !isEqual(newProcess, process)) {
      if (newProcess.status.toLocaleLowerCase() === "started") {
        startStateAction(true)
      } else if (newProcess.status.toLocaleLowerCase() === "finished") {
        endStateAction(false)
      }
      postProcessStateAction(newProcess)
    }
  }
  
  return (
    <div> {
      <Card className={`border-gray-300 mx-auto w-full p-6 rounded-lg shadow-lg`}>
        <div className={`space-y-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium">{`${t("Base Folder")}`}</Label>
              {
                !isBaseFolderOutdated ?
                  <Badge className={"bg-green-500"}>{t("In Sync")}</Badge> :
                  <Badge variant={"destructive"}>{t("Out of Sync")}</Badge>
              }
            </div>
            <div className="flex items-center space-x-2">
              {
                !isBaseFolderOutdated ?
                  <IconButton
                    tooltipContent={t("Verify integrity of base folder")}
                    buttonVariant={"outline"}
                    buttonDescription={t("Recheck")}
                    buttonIcon={<UpdateIcon/>}
                    onClick={checkBaseFolder}
                    isLoading={isCheckingBaseFolder}/> :
                  <IconButton
                    tooltipContent={t("Resynchronize folder")}
                    buttonVariant={"outline"}
                    buttonDescription={t("Sync")}
                    buttonIcon={<VscFoldUp/>}
                    onClick={syncBaseFolder}
                    isLoading={isSyncingBaseFolder}/>
              }
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium">{`${t("Patch Activation")}`}</Label>
              {
                !isPatchActivated ?
                  <Badge className={"bg-green-500"}>{t("Activated")}</Badge> :
                  <Badge variant={"destructive"}>{t("Not Activated")}</Badge>
              }
            </div>
            <div className="flex items-center space-x-2">
              {
                !isPatchActivated ?
                  <IconButton
                    tooltipContent={t("Check if imported_path.yml is activated in configuration")}
                    buttonVariant={"outline"}
                    buttonDescription={t("Recheck")}
                    buttonIcon={<UpdateIcon/>}
                    onClick={checkPatchActivation}
                    isLoading={isCheckingPatchActivation}/> :
                  <IconButton
                    tooltipContent={t("Activate patch")}
                    buttonVariant={"outline"}
                    buttonDescription={t("Activate")}
                    buttonIcon={<VscFoldUp/>}
                    onClick={activatePatch}
                    isLoading={isActivatingPatch}/>
              }
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium">{`${t("Mod Files")}`}</Label>
              {
                !isModFilesOutdated
                  ? <Badge className={"bg-green-500"}>{t("In Sync")}</Badge>
                  : <Badge variant={"destructive"}>{t("Out of Sync")}</Badge>
              }
            </div>
            <div className="flex items-center space-x-2">
              {
                gameMetadata &&
                  <FilesDialog
                      modVersion={gameMetadata.mod.modVersion}
                      files={gameMetadata.mod.files}
                      gameId={gameId}
                      triggerContent={
                        <div>
                          <IconButton
                            tooltipContent={t("Show mod files")}
                            buttonVariant={"outline"}
                            buttonDescription={t("Show files")}
                            buttonIcon={<FileIcon/>}
                            onClick={() => {
                            }}/>
                        </div>}
                  />
              }

            </div>
          </div>
          <IconButton
            isLoading={isLaunchingGame}
            isDisabled={isLaunchingGame}
            iconPosition={"right"}
            buttonSize={"lg"}
            tooltipContent={t("Launch game")}
            buttonVariant={"default"}
            buttonClassName={"w-full"}
            buttonDescription={`${t("Launch")} ${gameId}`}
            buttonIcon={<RocketIcon/>}
            onClick={async () => {
              await launchGame(rpcs3Path, gameId)
            }}/>
        </div>
      </Card>
    }
    </div>
  );
}

export default GameTabs;
