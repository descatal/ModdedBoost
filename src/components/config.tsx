import {Card} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {CheckIcon, RocketIcon,} from "@radix-ui/react-icons";
import {Label} from "@/components/ui/label.tsx";
import {useTranslation} from "react-i18next";
import TooltipComponent from "@/components/common/tooltip-component.tsx";
import {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api/tauri";
import {concatMetadata, FileMetadata, loadMetadata} from "@/lib/metadata.ts";
import {dirname} from "@tauri-apps/api/path";
import FilesDialog from "@/components/dialogs/files/files-dialog.tsx";
import {concatMirrors, loadMirrors, RemoteFiles} from "@/lib/mirrors.ts";
import {useConfigStore} from "@/lib/store/config.ts";

type ConfigProps = {
  enabled: boolean,
  title: string,
  rpcs3Path: string,
  gameId: "BLJS10250" | "NPJB00512"
}

export type Files = {
  remoteGroups: Map<string, string[]>,
  path: string,
  type: string,
  currentVersion: string
}

async function parseFiles(metadata: [string, FileMetadata][], mirrorGroups: Map<string, RemoteFiles[]>): Promise<Files[]> {
  return await Promise.all(
    metadata.map( async (item) => {
      const type = item[0]
      const fileMetadata = item[1]
      const files: Files = {
        path: fileMetadata.path,
        currentVersion: "-",
        type: type,
        remoteGroups: new Map<string, string[]>()
      }
      
      for (let [mirrorGroup, remoteFiles] of mirrorGroups.entries()) {
        const relevantFiles = remoteFiles.find(file => {
          return fileMetadata.remote.identifiers.some(id => {
            return file.identifier.toLocaleLowerCase() === id.toLocaleLowerCase()
          })
        })
        
        if (!relevantFiles)
          continue

        const existingRemotes = files.remoteGroups.get(mirrorGroup) ?? []
        relevantFiles.remotes.forEach(rf => existingRemotes.push(rf))
        files.remoteGroups.set(mirrorGroup, existingRemotes)
      }

      const { filesMetadataCache, setFilesMetadataCache } = useConfigStore.getState();
      const fileModifiedEpoch  = await invoke("get_file_modified_epoch", {
        fullPath: fileMetadata.path,
      }).catch(() => null) as number | null;
  
      if (fileModifiedEpoch)
      {
        const cachedFileMetadataIndex = filesMetadataCache.findIndex(c => c.path === fileMetadata.path)
        if (cachedFileMetadataIndex === -1 || filesMetadataCache[cachedFileMetadataIndex].lastModifiedEpoch !== fileModifiedEpoch)
        {
          // Do check since modified timestamp changed or there's no entry
          const fileMd5  = await invoke("check_file_md5", {
            fullPath: fileMetadata.path,
          }).catch(() => null) as string | null;

          // Ignore if the file is not found / invalid
          if (!fileMd5)
            return files

          const newMd5Info = { lastModifiedEpoch: fileModifiedEpoch, path: fileMetadata.path, md5: fileMd5 }
          if (cachedFileMetadataIndex === -1)
            filesMetadataCache.push(newMd5Info)
          else
            filesMetadataCache[cachedFileMetadataIndex] = newMd5Info
          
          await setFilesMetadataCache(filesMetadataCache)
          const md5Version = fileMetadata.md5.find(item => item.value.toLocaleLowerCase() == fileMd5?.toLocaleLowerCase())
          return {...files, currentVersion: md5Version?.version ?? "-"}
        }
      }
      
      return files
    })
  )
}

function Config({enabled, title, rpcs3Path, gameId}: ConfigProps) {
  const {t} = useTranslation();
  const [files, setFiles] = useState<Files[]>([])
  const [gameVersion, setGameVersion] = useState('')
  const [modVersion, setModVersion] = useState('')

  useEffect(() => {
    const getMetadata = async () => {
      const rpcs3Directory = await dirname(rpcs3Path)
      const loadedMirrors = await loadMirrors(false)
      const loadedMetadata = await loadMetadata(false, gameId, rpcs3Directory)
      setGameVersion(loadedMetadata.latestGameVersion)
      setModVersion(loadedMetadata.latestModVersion)
      const combinedMetadata = concatMetadata(loadedMetadata)
      const combinedMirrors = concatMirrors(loadedMirrors)
      const files = await parseFiles(combinedMetadata, combinedMirrors)
      
      setFiles(files)
    };

    if (enabled)
      getMetadata().catch(console.error)
  }, []);

  const launchGame = (rpcs3Path: String, gameId: "BLJS10250" | "NPJB00512") => {
    invoke("launch_game", {
      fullPath: rpcs3Path,
      gameType: gameId,
    });
  };

  return (
    <div className={enabled ? "" : "pointer-events-none"}>
      <Card
        className={`${enabled ? 'border-gray-300' : 'border-red-500'} mx-auto w-full p-6 rounded-lg shadow-lg`}>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t("Game Version")}</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold">Latest</span>
              <FilesDialog
                modVersion={modVersion}
                gameVersion={gameVersion}
                files={files}
                gameId={gameId}
                triggerContent={
                  <div>
                    <TooltipComponent
                      triggerContent={
                        <Button className={"bg-green-500"}
                                variant="outline"
                                size="icon">
                          <CheckIcon className={`w-3 h-3`}/>
                        </Button>
                      }
                      tooltipContent={t("Apply updates")}
                    />
                  </div>
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t("Mod Version")}</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold">0.0.5</span>
              <TooltipComponent
                triggerContent={
                  <Button className={"bg-green-500"}
                          variant="outline"
                          size="icon">
                    {<CheckIcon className={`w-3 h-3`}/>}
                  </Button>}
                tooltipContent={t("Apply updates")}
              />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => launchGame(rpcs3Path, gameId)}
            disabled={!enabled}
          >
            {t("Launch")} {title}
            <RocketIcon className="w-3 h-3 ml-2"/>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Config;
