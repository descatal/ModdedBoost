import React, {useEffect, useState} from "react";
import "./app/globals.css";
import {ThemeProvider} from "@/components/common/theme-provider.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import './i18n';
import {TooltipProvider} from "@/components/ui/tooltip.tsx";
import {RouterProvider} from "react-router-dom";
import Modals from "@/components/modal/modals.tsx";
import TitleBar from "@/components/common/title-bar/title-bar.tsx";
import {Router} from "@/Router.tsx";
import StoreLoaded from "@/components/store-loaded.tsx";
import {updateRcloneConf} from "@/lib/remote.ts";
import {invoke} from "@tauri-apps/api/core";

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    setIsInitialized(false)
    const initialize = async () => {
      await invoke("initialize_resources")
      await updateRcloneConf(true)
      setIsInitialized(true)
    }
    initialize().catch(err => console.error(err))
  }, [])
  
  return (
    <> 
      {
        isInitialized && <StoreLoaded>
              <TitleBar/>
              <React.Suspense fallback="loading">
                  <ThemeProvider>
                      <TooltipProvider>
                          <Modals/>
                          <RouterProvider router={Router()}/>
                          <Toaster position={"top-center"}/>
                      </TooltipProvider>
                  </ThemeProvider>
              </React.Suspense>
          </StoreLoaded>
      }
    </>
  );
}
