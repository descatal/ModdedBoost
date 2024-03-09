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
import {checkRpcs3Initialized, checkRpcs3Validity} from "@/lib/rpcs3.ts";
import {invoke} from "@tauri-apps/api/core";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {loadMetadata} from "@/lib/metadata.ts";
import {useAppStore} from "@/lib/store/app.ts";
import {shallow} from "zustand/shallow";

type DetectedGameVersions = {
  BLJS10250: boolean,
  NPJB00512: boolean
}

const Games = () => {
  const {t} = useTranslation();
  const rpcs3Path = useConfigStore((state) => state.rpcs3Path);
  const navigate = useNavigate();
  const { loadedMetadata, setLoadedMetadata } = useAppStore(
(state) => ({
      loadedMetadata: state.loadedMetadata,
      setLoadedMetadata: state.setLoadedMetadata,
    }),
    shallow
  );
  const [gameVersions, setGameVersions] = useState<DetectedGameVersions | undefined>();

  const checkRpcs3 = async () => {
    const isValidRpcs3: boolean = await checkRpcs3Validity(rpcs3Path)
    if (isValidRpcs3) {
      const initialized = await checkRpcs3Initialized(rpcs3Path)
      if (!initialized) {
        navigate(INITIALIZE_ROUTE)
      } else {
        invoke<DetectedGameVersions>("check_game_versions", {fullPath: rpcs3Path})
          .then((result) => {
            setGameVersions(result)
          })
          .catch()
      }
    } else {
      navigate(INITIALIZE_ROUTE)
    }
  }

  useEffect(() => {
    checkRpcs3().catch(err => console.error(err))
  }, []);

  useEffect(() => {
    const getMetadata = async () => {
      const metadata = await loadMetadata(true)
      setLoadedMetadata(metadata)
    };

    const timedRefresh = setInterval(async () => {
      //await getMetadata();
    }, 300000); // redo metadata refresh every 5 minutes
    
    if (gameVersions) {
      getMetadata().catch(console.error)
    }

    return () => clearInterval(timedRefresh);
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
                (!gameVersions || !loadedMetadata) ?
                  <div className={"flex-col space-y-3"}>
                    <Skeleton className={"h-12 w-full"}/>
                    <Skeleton className={"h-12 w-full"}/>
                  </div>
                  : !(gameVersions.BLJS10250 || gameVersions.NPJB00512) ?
                    <div>
                      <h1>{t("No games found!")}</h1>
                    </div>
                    : <Tabs
                        className={`min-w-[400px]`}
                        defaultValue={`${gameVersions.BLJS10250 ? "bljs" : "npjb"}`}>
                        <TabsList
                          className={`${gameVersions.BLJS10250 && gameVersions.NPJB00512 ? "grid-cols-2" : "grid-cols-1"} grid w-full`}>
                          {gameVersions.BLJS10250 && <TabsTrigger value="bljs">BLJS10250</TabsTrigger>}
                          {gameVersions.NPJB00512 && <TabsTrigger value="npjb">NPJB00512</TabsTrigger>}
                        </TabsList>
                        {
                          gameVersions.BLJS10250 &&
                            <TabsContent value="bljs">
                                <GameTabs gameId={"BLJS10250"} metadata={loadedMetadata} />
                            </TabsContent>
                        }
                        {
                          gameVersions.NPJB00512 &&
                            <TabsContent value="npjb">
                                <GameTabs gameId={"NPJB00512"} metadata={loadedMetadata} />
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