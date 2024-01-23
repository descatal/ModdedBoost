import React, {useEffect} from "react";
import "./app/globals.css";
import {ThemeProvider} from "@/components/common/theme-provider.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import Landing from "@/components/landing.tsx";
import './i18n';
import {TooltipProvider} from "@/components/ui/tooltip.tsx";
import {appWindow} from '@tauri-apps/api/window';

export default function App() {
  useEffect(() => {
    const setDecoration = async () => {
      await appWindow.setDecorations(true)
    }
    setDecoration().catch(console.error)
  }, []);

  return (
    <>
      <React.Suspense fallback="loading">
        <ThemeProvider>
          <TooltipProvider>
            <Landing/>
            <Toaster/>
          </TooltipProvider>
        </ThemeProvider>
      </React.Suspense>
    </>
  );
}
