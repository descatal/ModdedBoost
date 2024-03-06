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
import {MirrorGroupToggle} from "@/components/common/title-bar/mirror-group-toggle.tsx";
import {check} from "@tauri-apps/plugin-updater";
import {useAppStore} from "@/lib/store/app.ts";
import {toast} from "sonner";
import i18n from "i18next";

const TitleBar = () => {
  const {t} = useTranslation();
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [isChecking, setIsChecking] = useState(false)
  const {setOpenUpdateModal} = useAppStore()
  
  const updateIsWindowMaximized = useCallback(async () => {
    const resolvedPromise: boolean = await getCurrent().isMaximized();
    setIsWindowMaximized(resolvedPromise);
  }, []);

  useEffect(() => {
    updateIsWindowMaximized();

    let unlisten: UnlistenFn;
    const listen = async () => {
      unlisten = await getCurrent().onResized(() => {
        updateIsWindowMaximized();
      });
    };

    listen().catch(err => console.error(err));
    return () => unlisten && unlisten();
  }, []);

  const checkUpdate = async () => {
    setIsChecking(true)
    const checkResult = await check();
    if (checkResult && checkResult.available) {
      setOpenUpdateModal(checkResult)
    } else {
      toast.info(i18n.t("No updates found!"));
    }
    setIsChecking(false)
  }
  
  return (
    <div data-tauri-drag-region
         className={"h-10 flex justify-end fixed top-2 left-2 right-2"}>
      <div className={"flex"}>
        <div className="flex items-center justify-between">
          <IconButton
            buttonVariant={"ghost"}
            buttonDescription={t("Update")}
            tooltipContent={t("Check for launcher updates")}
            buttonIcon={<UpdateIcon className={"transition-all"}/>}
            onClick={async () => {await checkUpdate()}}
            breakpoint={"md"}
            isLoading={isChecking}
          />
          <MirrorGroupToggle/>
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