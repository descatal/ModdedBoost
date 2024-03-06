import React from "react";
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

export default function App() {
  return (
    <>
      <StoreLoaded>
        <TitleBar/>
        <React.Suspense fallback="loading">
          <ThemeProvider>
            <TooltipProvider>
              <Modals/>
              <RouterProvider router={Router()}/>
              <Toaster/>
            </TooltipProvider>
          </ThemeProvider>
        </React.Suspense>
      </StoreLoaded>
    </>
  );
}
