import React from "react";
import "./app/globals.css";
import {ThemeProvider} from "@/components/common/theme-provider.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import Landing from "@/components/landing.tsx";
import './i18n';

export default function App() {
    return (
        <>
            <React.Suspense fallback="loading">
                <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                    <Landing />
                    <Toaster />
                </ThemeProvider>
            </React.Suspense>
        </>
    );
}
