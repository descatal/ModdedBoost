import {Card} from "@/components/ui/card.tsx";
import {FileIcon, RocketIcon, UpdateIcon,} from "@radix-ui/react-icons";
import {Label} from "@/components/ui/label.tsx";
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
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
import {useAppStore} from "@/lib/store/app.ts";

type ConfigProps = {
  gameId: GameVersions,
  metadata: Metadata
}

function GameTabs({gameId, metadata}: ConfigProps) {
  const baseFolderSyncProcessId = `BaseFolderSync_${gameId}`;
  const defaultBaseFolderSyncProcess: ProcessProps = {
    id: baseFolderSyncProcessId,
    status: "Finished",
    name: baseFolderSyncProcessId,
    type: "Check",
    progress: 0,
    total: 0,
    percentage: 0
  }
  const baseFolderCheckProcessId = `BaseFolderSync_${gameId}`;
  const defaultBaseFolderCheckProcess: ProcessProps = {
    id: baseFolderCheckProcessId,
    status: "Finished",
    name: baseFolderCheckProcessId,
    type: "Check",
    progress: 0,
    total: 0,
    percentage: 0
  }
  const {t} = useTranslation();
  const {processes, addOrUpdateProcess} = useProcessListStore();
  const {rpcs3Path, mirrorGroup} = useConfigStore.getState()
  const {setOpenRunningProcessModal} = useAppStore()
  const {baseFolderLastChecked, setBaseFolderLastChecked} = useSessionStorage();
  const [baseFolderSyncProcess, setBaseFolderSyncProcess] = useState(defaultBaseFolderSyncProcess)
  const [baseFolderCheckProcess, setBaseFolderCheckProcess] = useState(defaultBaseFolderCheckProcess)
  const [isBaseFolderOutdated, setIsBaseFolderOutdated] = useState(false)
  const [isCheckingBaseFolder, setIsCheckingBaseFolder] = useState(false)
  const [isSyncingBaseFolder, setIsSyncingBaseFolder] = useState(false)
  const [isLaunchingGame, setIsLaunchingGame] = useState(false)
  // Make a clone of the object as different game versions should have their own copy of their metadata.
  const [gameMetadata, setGameMetadata] = useState(cloneDeep(metadata))

  useEffect(() => {
    const convertPaths = async () => {
      const rpcs3Directory = await dirname(rpcs3Path)
      transformPaths(rpcs3Directory, metadata, gameId).then(result => {
        result.mod.files = result.mod.files.filter(map => map.versions.includes(gameId))
        setGameMetadata(result)
      });
    }
    convertPaths().catch(console.error)
  }, [metadata])

  useEffect(() => {
    const lastCheckedTime = baseFolderLastChecked.find(item => item.gameId === gameId)
    const currentTime = new Date().getTime();
    const thresholdMs = 60 * 60 * 1000;
    if (!lastCheckedTime || (currentTime - lastCheckedTime.timestamp) > thresholdMs) {
      // Only execute check if the last check is 1 hour or more
      checkBaseFolder().catch(err => console.error(err));
    }
    
    // let hasError = false;
    // const listenBaseFolderCheck = listen<string>(
    //   "rclone_check_base_folder",
    //   async (event) => {
    //     const lowerCasePayload = event.payload.toLocaleLowerCase();
    //     if (lowerCasePayload.includes("start")) {
    //       console.log("check start", mirrorGroup)
    //       hasError = false;
    //     } else if (lowerCasePayload.includes("end")) {
    //       console.log("check end")
    //       setIsCheckingBaseFolder(false)
    //      
    //       // hasError = needs to redo sync
    //       if (hasError) {
    //         setIsBaseFolderOutdated(hasError)
    //        
    //         // Also reset the last checked time to zero so if user refresh the page it'll do the check
    //         await setBaseFolderLastChecked(0)
    //       } else {
    //         await setBaseFolderLastChecked(Date.now())
    //       }
    //     } else if (lowerCasePayload.includes("errors:")) {
    //       hasError = true;
    //     }
    //   }
    // )
    //
    // const listenBaseFolderSync = listen<string>(
    //   "rclone_sync_base_folder",
    //   async (event) => {
    //     const lowerCasePayload = event.payload.toLocaleLowerCase();
    //     if (lowerCasePayload.includes("end")) {
    //       console.log("check end")
    //       setIsSyncingBaseFolder(false)
    //      
    //       // Once the sync is done, redo the check while assuming optimistic result
    //       setIsBaseFolderOutdated(false)
    //       await checkBaseFolder();
    //     } else if (lowerCasePayload.includes("start")) {
    //       console.log("check start", mirrorGroup)
    //     }
    //   }
    // )

    return () => {
      // listenBaseFolderCheck.then(f => f());
      // listenBaseFolderSync.then(f => f());
    };
  }, []);

  const launchGame = async (rpcs3Path: String, gameId: "BLJS10250" | "NPJB00512") => {
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
    const rpcs3Directory = await dirname(rpcs3Path);
    const targetDirectory = await join(rpcs3Directory, `dev_hdd0/game/${gameId}/`)
    const runCommand = async (remote: string) => {
      return await invoke<boolean>("rclone_command", {
        command: "check",
        remote: `${remote}`,
        remotePath: `${remote}:/base_folders/${gameId}`,
        targetPath: targetDirectory,
        additionalFlags: "--fast-list",
        excludeItems: gameMetadata!.base.excludePaths,
        listenerId: "check_base_folder"
      });
    }

    for (const item of mirrorGroup.remotes) {
      try {
        toast.info(i18n.t("Validating base folder..."));
        await addOrUpdateProcess({...baseFolderCheckProcess, status: "Started"})
        const commandResult = await runCommand(item.rcloneName)
        if (commandResult) {
          await setBaseFolderLastChecked(gameId, new Date().getTime())
        }
        setIsBaseFolderOutdated(!commandResult)
        break
      } catch (e) {
        console.error(e);
      } finally {
        toast.success(i18n.t("Base folder validation complete."));
        await addOrUpdateProcess({...baseFolderCheckProcess, status: "Finished"})
      }
    }
  };

  const syncBaseFolder = async () => {
    const rpcs3Directory = await dirname(rpcs3Path);
    const targetDirectory = await join(rpcs3Directory, `dev_hdd0/game/${gameId}/`)
    const runCommand = async (remote: string) => {
      return await invoke<boolean>("rclone_command", {
        command: "sync",
        remote: `${remote}`,
        remotePath: `${remote}:/base_folders/${gameId}`,
        targetPath: targetDirectory,
        additionalFlags: "--delete-during --ignore-size --verbose --no-update-modtime --transfers 4 --checkers 8 --contimeout 60s --timeout 300s --retries 3 --low-level-retries 10 --stats 1s --stats-file-name-length 0 --fast-list",
        excludeItems: gameMetadata!.base.excludePaths,
        listenerId: "sync_base_folder"
      });
    }

    for (const item of mirrorGroup.remotes) {
      try {
        toast.info(i18n.t("Starting base folder sync..."));
        await addOrUpdateProcess({...baseFolderSyncProcess, status: "Started"})
        const commandResult = await runCommand(item.rcloneName)
        if (commandResult) await setBaseFolderLastChecked(gameId, new Date().getTime())
        setIsBaseFolderOutdated(!commandResult)
        break
      } catch (e) {
        console.error(e);
      } finally {
        toast.success(i18n.t("Base folder sync complete."));
        await addOrUpdateProcess({...baseFolderSyncProcess, status: "Finished"})
      }
    }
  };

  useEffect(() => {
    const newBaseFolderCheckProcess = processes.find(process => process.id === baseFolderCheckProcessId)
    const newBaseFolderSyncProcess = processes.find(process => process.id === baseFolderSyncProcessId)
    if (newBaseFolderCheckProcess && !isEqual(newBaseFolderCheckProcess, baseFolderCheckProcess)) {
      if (newBaseFolderCheckProcess.status.toLocaleLowerCase() === "started") {
        setIsCheckingBaseFolder(true)
      } else if (newBaseFolderCheckProcess.status.toLocaleLowerCase() === "finished") {
        setIsCheckingBaseFolder(false)
      }
      setBaseFolderCheckProcess(newBaseFolderCheckProcess)
    }
    if (newBaseFolderSyncProcess && !isEqual(newBaseFolderSyncProcess, baseFolderSyncProcess)) {
      if (newBaseFolderSyncProcess.status.toLocaleLowerCase() === "started") {
        setIsSyncingBaseFolder(true)
      } else if (newBaseFolderSyncProcess.status.toLocaleLowerCase() === "finished") {
        setIsSyncingBaseFolder(false)
      }
      setBaseFolderSyncProcess(newBaseFolderSyncProcess)
    }
  }, [processes])

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
              <Label className="text-sm font-medium">{`${t("Mod Files")}`}</Label>
              {/*<Badge>{`${metadata.mod.modVersion}`}</Badge>*/}
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
