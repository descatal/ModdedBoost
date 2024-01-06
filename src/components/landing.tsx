import { Button } from "@/components/ui/button.tsx";
import { FileIcon } from "@radix-ui/react-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import Config from "@/components/config.tsx";
import { ModeToggle } from "@/components/common/mode-toggle.tsx";
import { LanguageToggle } from "@/components/common/language-toggle.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/api/dialog";
import { useEffect, useState } from "react";
import { desktopDir } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { useStore } from "@/lib/store.ts";
import { shallow } from "zustand/shallow";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

// same type as payload
export type FullBoostVersions = {
  bljs: boolean;
  npjb: boolean;
};

export default function Landing() {
  const { t, i18n } = useTranslation();
  const [ fullBoostVersions, setFullBoostVersions] =
    useState<FullBoostVersions>({
      bljs: false,
      npjb: false,
    });  
  const { rpcs3Path, setRpcs3Path } = useStore(
    (state) => ({
      rpcs3Path: state.rpcs3Path,
      setRpcs3Path: state.setRpcs3Path,
    }),
    shallow
  );

  useEffect(() => {
    const subscribePathChangedEvent = async ()=> {
      await listen<FullBoostVersions>("rpcs3-games", (event) => {
          setFullBoostVersions(event.payload);
          if (!event.payload.bljs && !event.payload.npjb) {
            toast.error(i18n.t("No games found!"));
          } else {
            toast.success(i18n.t("Games found!"));
          }
        }
      )
    }
    subscribePathChangedEvent()
      .catch(console.error);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      await processDirectory();
    }, 1000);
    return () => clearTimeout(delayDebounceFn);
  }, [rpcs3Path]);
  
  const handlePathChange = async (event: { target: { value: any; }; }) => {
    await setRpcs3Path(event.target.value);
  };

  const changeRpcs3Path = async () => {
    const selectedPath = await selectSingleFileSystemDialog(rpcs3Path, false);
    if (!selectedPath)
      return;
    await processDirectory();
    await setRpcs3Path(selectedPath);
  };

  const processDirectory = async () => {
    if (!rpcs3Path) return;

    toast(i18n.t("Rpcs3 path changed, processing directory..."));
    invoke("check_full_boost_game_version", {fullPath: rpcs3Path}).catch(() => {
      toast.error(i18n.t("File not found!"));
    })
  }
            
  return (
    <main key="1" className="min-h-screen py-12 px-4 md:py-24 md:px-6 lg:py-32">
      <Card className="mx-auto w-full max-w-[500px] p-6 rounded-lg shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Modded Boost</h1>
            <div className="flex items-center justify-between space-x-2">
              <LanguageToggle />
              <ModeToggle />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium" htmlFor="path">
                <Tooltip>
                  <TooltipTrigger>{t("Rpcs3 executable path")}</TooltipTrigger>
                  <TooltipContent>
                    <p>.exe | .AppImage | .app</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
 
              <div className="flex justify-between items-center space-x-2 mt-2">
                <Input
                  className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  id="rpcs3-path"
                  name="rpcs3-path"
                  placeholder="/path/to/rpcs3"
                  type="text"
                  multiple={false}
                  onChange={handlePathChange}
                  value={rpcs3Path}
                />
                <Button variant="outline" onClick={changeRpcs3Path}>
                  <FileIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Tabs defaultValue="bljs" className="w-[400px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bljs">BLJS10250</TabsTrigger>
                <TabsTrigger value="npjb">NPJB00512</TabsTrigger>
              </TabsList>
              <TabsContent value="bljs">
                <Config
                  enabled={fullBoostVersions.bljs}
                  title={"BLJS10250"}
                  rpcs3Path={rpcs3Path}
                  gameVersion={"bljs"}
                />
              </TabsContent>
              <TabsContent value="npjb">
                <Config
                  enabled={fullBoostVersions.npjb}
                  title={"NPJB00512"}
                  rpcs3Path={rpcs3Path}
                  gameVersion={"npjb"}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

const selectSingleFileSystemDialog = async (defaultPath: string, directory: boolean) => {
  const selected = await open({
    directory: directory || false,
    multiple: false,
    defaultPath: defaultPath || await desktopDir(),
  });
  
  // user selected multiple files or cancelled the selection
  if (Array.isArray(selected) || selected === null) return;

  // else, user selected a single file
  return selected;
};
