import "./app/globals.css";
import Landing from "@/components/landing.tsx";
import {ThemeProvider} from "@/components/common/theme-provider.tsx";
import './i18n';
import React from "react";

export default function App() {
    return (
        <>
            <React.Suspense fallback="loading">
                <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                    <Landing />
                </ThemeProvider>
            </React.Suspense>
        </>
    );
}
