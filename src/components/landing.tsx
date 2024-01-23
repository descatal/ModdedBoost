import {UpdateIcon} from "@radix-ui/react-icons";
import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs.tsx";
import Config from "@/components/config.tsx";
import {ModeToggle} from "@/components/common/mode-toggle.tsx";
import {LanguageToggle} from "@/components/common/language-toggle.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {useTranslation} from "react-i18next";
import {useEffect, useRef, useState} from "react";
import {invoke} from "@tauri-apps/api/tauri";
import {emit, listen} from "@tauri-apps/api/event";
import {toast} from "sonner";
import {useConfigStore} from "@/lib/store/config.ts";
import {shallow} from "zustand/shallow";
import {Tooltip, TooltipContent, TooltipTrigger} from "./ui/tooltip";
import {getVersion} from "@tauri-apps/api/app";
import {debounce} from 'lodash';
import FileSelectIconButton from "@/components/common/file-select-icon-button.tsx";
import IconButton from "@/components/common/icon-button.tsx";

// same type as payload
export type FullBoostVersions = {
  bljs: boolean;
  npjb: boolean;
};

export default function Landing() {
  const {t, i18n} = useTranslation();
  const [fullBoostVersions, setFullBoostVersions] =
    useState<FullBoostVersions>({
      bljs: false,
      npjb: false,
    });
  const {rpcs3Path, setRpcs3Path} = useConfigStore(
(state) => ({
      rpcs3Path: state.rpcs3Path,
      setRpcs3Path: state.setRpcs3Path,
    }),
    shallow
  );
  const [appVersion, setAppVersion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the input handler to delay processing
  const debouncedHandleChange = debounce(async () => {
    const currentPath = inputRef.current!.value;
    await setRpcs3Path(currentPath);
    await processDirectory(currentPath);
  }, 500);

  const changeRpcs3Path = async (selectedPath: string | string[] | null) => {
    // user selected multiple files or cancelled the selection
    if (Array.isArray(selectedPath) || selectedPath === null) return;
    
    inputRef.current!.value = selectedPath
    debouncedHandleChange.cancel() // cancel in case someone else is typing
    await setRpcs3Path(selectedPath)
    await processDirectory(selectedPath);
  };

  // Handle manual inputs
  const handleRpcs3PathChange = (event: { target: { value: string; }; }) => {
    // Update the ref with the new value
    inputRef.current!.value = event.target.value;
    
    // Invoke the debounced function
    debouncedHandleChange();
  };

  const processDirectory = async (path: string) => {
    toast(i18n.t("Rpcs3 path changed, processing directory..."));
    invoke("check_full_boost_game_version", {fullPath: path}).catch(() => {
      setFullBoostVersions({npjb: false, bljs: false})
      toast.error(i18n.t("File not found!"));
    })
  }
  
  useEffect(() => {
    getVersion().then(version => setAppVersion(version));
    
    const subscribePathChangedEvent = async () => {
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
    subscribePathChangedEvent().catch(console.error);

    // Invoke the debounced function for first time loading
    debouncedHandleChange()
  }, []);
  
  return (
    <main key="1" className="bg-slate-200/85 dark:bg-slate-800/85 min-h-screen py-12 px-4 md:py-24 md:px-6 lg:py-32">
      <Card className="mx-auto w-full max-w-[85%] lg:max-w-[900px] min-w-[500px] p-6 rounded-lg shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Modded Boost</h1>
            <div className="flex items-center justify-between space-x-2">
              <span className="text-sm font-bold">{appVersion}</span>
              <IconButton 
                buttonDescription={t("Update")} 
                tooltipContent={t("Check for launcher updates")} 
                buttonIcon={<UpdateIcon className={"transition-all"}/>} 
                onClick={async () => {await emit('tauri://update')}}
                breakpoint={"md"}
              />
              <LanguageToggle/>
              <ModeToggle/>
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
                  defaultValue={rpcs3Path}
                  ref={inputRef}
                  onChange={handleRpcs3PathChange}
                  className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="/path/to/rpcs3"
                  type="text"
                />
                <FileSelectIconButton 
                  directory={false} 
                  defaultPath={rpcs3Path} 
                  multiple={false} 
                  onFilesSelected={changeRpcs3Path} 
                  buttonDescription={t("Choose file")}
                  tooltipContent={t("Open file dialog")}
                />
              </div>
            </div>
            <Tabs defaultValue="bljs" className="min-w-[400px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bljs">BLJS10250</TabsTrigger>
                <TabsTrigger value="npjb">NPJB00512</TabsTrigger>
              </TabsList>
              <TabsContent value="bljs">
                <Config
                  enabled={fullBoostVersions.bljs}
                  title={"BLJS10250"}
                  rpcs3Path={rpcs3Path}
                  gameId={"BLJS10250"}
                />
              </TabsContent>
              <TabsContent value="npjb">
                <Config
                  enabled={fullBoostVersions.npjb}
                  title={"NPJB00512"}
                  rpcs3Path={rpcs3Path}
                  gameId={"NPJB00512"}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
