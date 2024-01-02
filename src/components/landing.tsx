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
import { open } from '@tauri-apps/api/dialog';
import {SetStateAction, useEffect, useState} from "react";
import {desktopDir} from "@tauri-apps/api/path";
import {invoke} from "@tauri-apps/api/tauri";
import {listen} from "@tauri-apps/api/event";
import { toast } from "sonner";

// same type as payload
type FullBoostVersions = {
  bljs: boolean,
  npjb: boolean,
};

export default function Landing() {
  const { t, i18n } = useTranslation();
  const [ rpcs3Path, setRpcs3Path] = useState("");

  useEffect(() => {
    const subscribeDirectoryChangedEvent = async () => {
      await listen<FullBoostVersions>('directory-changed', (event) => {
        if (!event.payload.bljs && !event.payload.npjb)
          toast.error(i18n.t("No games found!"));
        else
          toast.success(i18n.t("Games found!"));
      });
    }
    subscribeDirectoryChangedEvent()
      .catch(console.error);
  }, [])
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      await processDirectory();
    }, 1000);
    return () => clearTimeout(delayDebounceFn);
  }, [rpcs3Path]);
  
  const handleDirectoryChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setRpcs3Path(event.target.value);
  };

  const changeDirectory = async () => {
    const selectedDirectory = await selectDirectoryDialog();
    if (!selectedDirectory)
      return;
    await processDirectory();
    setRpcs3Path(selectedDirectory);
  };

  const processDirectory = async () => {
    if (!rpcs3Path)
      return;
      
    toast(i18n.t("RPCS3 Directory Changed"));
    invoke("check_full_boost_game_version", { fullPath: rpcs3Path });
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
                {t("RPCS3 Directory")}
              </Label>
              <div className="flex justify-between items-center space-x-2 mt-2">
                <Input
                  className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  id="rpcs3-path"
                  name="rpcs3-path"
                  placeholder="/path/to/rpcs3"
                  type="text"
                  multiple={false}
                  onChange={handleDirectoryChange}
                  value={rpcs3Path}
                />
                <Button variant="outline" onClick={changeDirectory}>
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
                <Config title={"BLJS10250"} rpcs3Path={rpcs3Path} />
              </TabsContent>
              <TabsContent value="npjb">
                <Config title={"NPJB00512"} rpcs3Path={rpcs3Path} />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

const selectDirectoryDialog = async () => {
  const selected = await open({
    directory: true,
    multiple: false,
    defaultPath: await desktopDir(),
  });

  // user selected multiple files or cancelled the selection
  if (Array.isArray(selected) || selected === null)
    return;

  // else, user selected a single file
  return selected;
}