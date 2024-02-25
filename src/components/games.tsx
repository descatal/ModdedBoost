import {useEffect, useState} from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import GameTabs from "@/components/game-tabs.tsx";
import {useConfigStore} from "@/lib/store/config.ts";
import {useTranslation} from "react-i18next";
import IconButton from "@/components/common/icon-button.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Input} from "@/components/ui/input.tsx";
import {VscFolderOpened} from "react-icons/vsc";
import {useNavigate} from "react-router-dom";
import {INITIALIZE_ROUTE} from "@/lib/constants.ts";
import {CheckRpcs3Initialized, CheckRpcs3Validity} from "@/lib/rpcs3.ts";
import {invoke} from "@tauri-apps/api/core";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {loadMirrors, Mirrors} from "@/lib/mirrors.ts";
import {loadMetadata, Metadata} from "@/lib/metadata.ts";

export type GameVersions = {
  bljs: boolean;
  npjb: boolean;
};

const Games = () => {
  const {t} = useTranslation();
  const rpcs3Path = useConfigStore((state) => state.rpcs3Path);
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState<Metadata>()
  const [mirrors, setMirrors] = useState<Mirrors>()
  const [gameVersions, setGameVersions] = useState<GameVersions | undefined>();

  const checkRpcs3Validity = async () => {
    const isValidRpcs3: boolean = await CheckRpcs3Validity(rpcs3Path)
    if (isValidRpcs3) {
      const initialized = await CheckRpcs3Initialized(rpcs3Path)
      if (!initialized) {
        navigate(INITIALIZE_ROUTE)
      } else {
        invoke<GameVersions>("check_game_versions", {fullPath: rpcs3Path})
          .then((result) => setGameVersions(result))
          .catch()
      }
    } else {
      navigate(INITIALIZE_ROUTE)
    }
  }

  useEffect(() => {
    checkRpcs3Validity().catch(err => console.error(err))
  }, []);

  useEffect(() => {
    const getMetadata = async () => {
      const loadedMirrors = await loadMirrors(false)
      const loadedMetadata = await loadMetadata(false)

      setMetadata(loadedMetadata)
      setMirrors(loadedMirrors)
    };

    if (gameVersions) {
      getMetadata().catch(console.error)
    }
  }, [gameVersions])

  return (
    <div className={"min-h-screen flex h-screen"}>
      <div className={"m-auto w-full max-w-md space-y-6"}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Modded Boost</h1>

        </div>
        <div className={`space-y-4`}>
          <Card>
            <CardHeader>
              <CardTitle>{t("Current Game Directory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={"space-y-3"}>
                <Input
                  disabled={true}
                  value={rpcs3Path}
                  className="w-full px-3 py-2 border rounded-md shadow-sm text-center"
                />
                <IconButton
                  buttonVariant={"default"}
                  breakpoint={"none"}
                  buttonClassName={"w-full"}
                  onClick={() => {
                    navigate("/initialize")
                  }}
                  buttonDescription={t("Change directory")}
                  tooltipContent={t("Change rpcs3 directory")}
                  buttonIcon={<VscFolderOpened/>}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("Game Versions")}</CardTitle>
            </CardHeader>
            <CardContent>
              {
                (!gameVersions || !metadata) ?
                  <div className={"flex-col space-y-3"}>
                    <Skeleton className={"h-12 w-full"}/>
                    <Skeleton className={"h-12 w-full"}/>
                  </div>
                  : !(gameVersions.bljs || gameVersions.npjb) ?
                    <div>
                      <h1>{t("No games found!")}</h1>
                    </div>
                    : <Tabs
                        className={`min-w-[400px]`}
                        defaultValue={`${gameVersions.bljs ? "bljs" : "npjb"}`}>
                        <TabsList
                          className={`${gameVersions.bljs && gameVersions.npjb ? "grid-cols-2" : "grid-cols-1"} grid w-full`}>
                          {gameVersions.bljs && <TabsTrigger value="bljs">BLJS10250</TabsTrigger>}
                          {gameVersions.npjb && <TabsTrigger value="npjb">NPJB00512</TabsTrigger>}
                        </TabsList>
                        {
                          gameVersions.bljs &&
                            <TabsContent value="bljs">
                                <GameTabs gameId={"BLJS10250"} metadata={metadata}/>
                            </TabsContent>
                        }
                        {
                          gameVersions.npjb &&
                            <TabsContent value="npjb">
                                <GameTabs gameId={"NPJB00512"} metadata={metadata}/>
                            </TabsContent>
                        }
                    </Tabs>
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Games;