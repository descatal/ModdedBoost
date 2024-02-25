import {Card} from "@/components/ui/card.tsx";
import {FileIcon, RocketIcon, UpdateIcon,} from "@radix-ui/react-icons";
import {Label} from "@/components/ui/label.tsx";
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api/core";
import {Metadata, replaceGameId} from "@/lib/metadata.ts";
import {dirname, join} from "@tauri-apps/api/path";
import FilesDialog from "@/components/dialogs/files/files-dialog.tsx";
import IconButton from "@/components/common/icon-button.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {useConfigStore} from "@/lib/store/config.ts";
import {listen} from "@tauri-apps/api/event";
import {VscFoldUp} from "react-icons/vsc";

type ConfigProps = {
  gameId: "BLJS10250" | "NPJB00512",
  metadata: Metadata
}

function GameTabs({gameId, metadata}: ConfigProps) {
  const {t} = useTranslation();
  const {rpcs3Path, baseFolderLastChecked, setBaseFolderLastChecked} = useConfigStore.getState()
  const [isBaseFolderOutdated, setIsBaseFolderOutdated] = useState(false)
  const [isCheckingBaseFolder, setIsCheckingBaseFolder] = useState(false)
  const [isSyncingBaseFolder, setIsSyncingBaseFolder] = useState(false)

  useEffect(() => {
    replaceGameId(metadata, gameId).then(result => metadata = result);

    let hasError = false;
    const currentTime = Date.now();
    const thresholdMs = 60 * 60 * 1000;
    if ((currentTime - baseFolderLastChecked) > thresholdMs) {
      // Only execute check if the last check is 1 hour or more
      checkBaseFolder().catch(err => console.error(err));
    }

    const listenBaseFolderCheck = listen<string>(
      "rclone_check_base_folder",
      async (event) => {
        const lowerCasePayload = event.payload.toLocaleLowerCase();
        if (lowerCasePayload.includes("start")) {
          console.log("check start")
          hasError = false;
        } else if (lowerCasePayload.includes("end")) {
          console.log("check end")
          setIsCheckingBaseFolder(false)
          
          // hasError = needs to redo sync
          if (hasError) {
            setIsBaseFolderOutdated(hasError)
            
            // Also reset the last checked time to zero so if user refresh the page it'll do the check
            await setBaseFolderLastChecked(0)
          } else {
            await setBaseFolderLastChecked(Date.now())
          }
        } else if (lowerCasePayload.includes("errors:")) {
          hasError = true;
        }
      }
    )

    const listenBaseFolderSync = listen<string>(
      "rclone_sync_base_folder",
      async (event) => {
        const lowerCasePayload = event.payload.toLocaleLowerCase();
        if (lowerCasePayload.includes("end")) {
          console.log("check end")
          setIsSyncingBaseFolder(false)
          
          // Once the sync is done, redo the check while assuming optimistic result
          setIsBaseFolderOutdated(false)
          await checkBaseFolder();
        } else if (lowerCasePayload.includes("start")) {
          console.log("check start")
        }
      }
    )

    return () => {
      listenBaseFolderCheck.then(f => f());
      listenBaseFolderSync.then(f => f());
    };
  }, []);

  const launchGame = (rpcs3Path: String, gameId: "BLJS10250" | "NPJB00512") => {
    invoke("launch_game", {
      fullPath: rpcs3Path,
      gameType: gameId,
    });
  };

  const checkBaseFolder = async () => {
    setIsCheckingBaseFolder(true)

    const rpcs3Directory = await dirname(rpcs3Path);
    const moddedBoostCacheDirectory = await join(rpcs3Directory, `dev_hdd0/game/${gameId}/`)
    invoke("rclone_command", {
      command: "check",
      remote: "googledrive",
      remotePath: `googledrive:/base_folders/${gameId}`,
      cachePath: moddedBoostCacheDirectory,
      additionalFlags: "--combined --fast-list",
      excludeItems: metadata!.base.excludePaths,
      listenerId: "check_base_folder"
    });
  };

  const syncBaseFolder = async () => {
    setIsSyncingBaseFolder(true)
    const rpcs3Directory = await dirname(rpcs3Path);
    const moddedBoostCacheDirectory = await join(rpcs3Directory, `dev_hdd0/game/${gameId}/`)
    invoke("rclone_command", {
      command: "sync",
      remote: "googledrive",
      remotePath: `googledrive:/base_folders/${gameId}`,
      cachePath: moddedBoostCacheDirectory,
      additionalFlags: "--delete-during --ignore-size --verbose --no-update-modtime --transfers 4 --checkers 8 --contimeout 60s --timeout 300s --retries 3 --low-level-retries 10 --stats 1s --stats-file-name-length 0 --fast-list",
      excludeItems: metadata!.base.excludePaths,
      listenerId: "sync_base_folder"
    });
  };

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
                    buttonIcon={<VscFoldUp />}
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
                metadata &&
                  <FilesDialog
                      files={metadata.mod.files}
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
            iconPosition={"right"}
            buttonSize={"lg"}
            tooltipContent={t("Launch game")}
            buttonVariant={"default"}
            buttonClassName={"w-full"}
            buttonDescription={`${t("Launch")} ${gameId}`}
            buttonIcon={<RocketIcon/>}
            onClick={() => {
              launchGame(rpcs3Path, gameId)
            }}/>
        </div>
      </Card>
    }
    </div>
  );
}

export default GameTabs;
