import {useCallback, useEffect, useState} from 'react';
import IconButton from "@/components/common/icon-button.tsx";
import {UpdateIcon} from "@radix-ui/react-icons";
import {UnlistenFn} from "@tauri-apps/api/event";
import {LanguageToggle} from "@/components/common/title-bar/language-toggle.tsx";
import {ModeToggle} from "@/components/common/title-bar/mode-toggle.tsx";
import TitleBarButtons from "@/components/common/title-bar/title-bar-buttons.tsx";
import {VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore} from "react-icons/vsc";
import {getCurrent} from "@tauri-apps/api/window";
import {useTranslation} from "react-i18next";
import {MirrorGroupSelector} from "@/components/common/title-bar/mirror-group-selector.tsx";
import {check} from "@tauri-apps/plugin-updater";
import {useAppStore} from "@/lib/store/app.ts";
import {toast} from "sonner";
import i18n from "i18next";
import {Badge} from "@/components/ui/badge.tsx";
import {useConfigStore} from "@/lib/store/config.ts";

const TitleBar = () => {
  const {t} = useTranslation();
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [isChecking, setIsChecking] = useState(false)
  const {setOpenUpdateModal} = useAppStore()
  const {beta} = useConfigStore.getState();
  
  const updateIsWindowMaximized = useCallback(async () => {
    const resolvedPromise: boolean = await getCurrent().isMaximized();
    setIsWindowMaximized(resolvedPromise);
  }, []);

  useEffect(() => {
    updateIsWindowMaximized().catch(err => console.error(err));

    let unlisten: UnlistenFn;
    const listen = async () => {
      unlisten = await getCurrent().onResized(() => {
        updateIsWindowMaximized();
      });
    };

    listen().catch(err => console.error(err));
    return () => unlisten && unlisten();
  }, []);

  const checkUpdate = async (showToast: boolean) => {
    setIsChecking(true)
    const checkResult = await check();
    if (checkResult && checkResult.available) {
      setOpenUpdateModal(checkResult)
    } else if (showToast) {
      toast.info(i18n.t("No updates found!"));
    }
    setIsChecking(false)
  }
  
  useEffect(() => {
    const timedCheck = setInterval(async () => {
      await checkUpdate(false);
    }, 86400000); // redo check every day
    
    checkUpdate(false).catch(console.error)
    
    return () => clearInterval(timedCheck);  
  }, [])
  
  return (
    <div data-tauri-drag-region
         className={"h-10 flex justify-end fixed top-2 left-2 right-2"}>
      <div className={"flex"}>
        <div className="flex items-center justify-between">
          <>
            {
              beta ?       
                <Badge className={"bg-primary"}>{t("BETA")}</Badge>
                : <></>
            }
          </>
          <IconButton
            buttonVariant={"ghost"}
            buttonDescription={t("Update")}
            tooltipContent={t("Check for launcher updates")}
            buttonIcon={<UpdateIcon className={"transition-all"}/>}
            onClick={async () => {await checkUpdate(true)}}
            breakpoint={"md"}
            isLoading={isChecking}
          />
          <MirrorGroupSelector/>
          <LanguageToggle/>
          <ModeToggle/>
        </div>
        <div className={"flex"}>
          <TitleBarButtons buttonIcon={<VscChromeMinimize/>} onClick={async () => {
            await getCurrent().minimize()
          }}/>
          {
            isWindowMaximized ?
              <TitleBarButtons buttonIcon={<VscChromeRestore/>} onClick={async () => {
                await getCurrent().unmaximize()
              }}/> :
              <TitleBarButtons buttonIcon={<VscChromeMaximize/>} onClick={async () => {
                await getCurrent().maximize()
              }}/>
          }
          <TitleBarButtons buttonIcon={<VscChromeClose/>} onClick={async () => {
            await getCurrent().close()
          }}/>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;