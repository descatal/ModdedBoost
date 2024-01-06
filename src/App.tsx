import React from "react";
import "./app/globals.css";
import {ThemeProvider} from "@/components/common/theme-provider.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import Landing from "@/components/landing.tsx";
import './i18n';
import {TooltipProvider} from "@/components/ui/tooltip.tsx";

export default function App() {
    return (
        <>
            <React.Suspense fallback="loading">
                <ThemeProvider>
                  <TooltipProvider>
                    <Landing />
                    <Toaster />
                  </TooltipProvider>
                </ThemeProvider>
            </React.Suspense>
        </>
    );
}
