import {useCallback, useEffect, useState} from 'react';
import IconButton from "@/components/common/icon-button.tsx";
import {UpdateIcon} from "@radix-ui/react-icons";
import {emit, UnlistenFn} from "@tauri-apps/api/event";
import {LanguageToggle} from "@/components/common/language-toggle.tsx";
import {ModeToggle} from "@/components/common/mode-toggle.tsx";
import TitleBarButtons from "@/components/common/title-bar-buttons.tsx";
import {VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore} from "react-icons/vsc";
import {getCurrent} from "@tauri-apps/api/window";
import {useTranslation} from "react-i18next";

const TitleBar = () => {
  const {t} = useTranslation();
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);

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
            onClick={async () => {
              await emit('tauri://update')
            }}
            breakpoint={"md"}
          />
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