import {Store} from "tauri-plugin-store-api";
import {DEFAULT_LANGUAGE, DEFAULT_THEME} from "@/lib/constants.ts";
import {create} from "zustand";
import {z} from "zod";
import i18n from "i18next";
import {appConfigDir} from "@tauri-apps/api/path";

const tauriStore = new Store(".settings.dat");
const storageKey = "vite-ui-theme";

type Theme = "dark" | "light" | "system"

export interface ModdedBoostStore {
  theme: Theme;
  language: string;
  rpcs3Path: string;
  setTheme: (theme: Theme) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  setRpcs3Path: (rpcs3_path: string) => Promise<void>;
  _hydrated: boolean;
}

export const useStore = create<ModdedBoostStore>()((set) => ({
  theme: (localStorage.getItem(storageKey) as Theme) || DEFAULT_THEME,
  language: i18n.language || DEFAULT_LANGUAGE,
  rpcs3Path: "",
  setTheme: async (theme) => {
    set({ theme: theme });
    localStorage.setItem(storageKey, theme);
    await tauriStore.set("theme", theme);
    await tauriStore.save();
  },
  setLanguage: async (language) => {
    set({ language: language });
    await tauriStore.set("language", language);
    await tauriStore.save();
  },
  setRpcs3Path: async (rpcs3Path) => {
    set({ rpcs3Path: rpcs3Path });
    await tauriStore.set("rpcs3_path", rpcs3Path);
    await tauriStore.save();
  },
  _hydrated: false,
}));

const hydrate = async () => {
  const theme = await tauriStore.get("theme");
  const language = await tauriStore.get("language");
  const rpcs3Path = await tauriStore.get("rpcs3_path");

  const parsedTheme = z.enum(["dark", "light", "system"]).safeParse(theme);
  const parsedLanguage = z.string().safeParse(language);
  const parsedRpcs3Path = z.string().safeParse(rpcs3Path);

  if (parsedTheme.success) {
    useStore.setState({ theme: parsedTheme.data });
  }

  if (parsedLanguage.success) {
    useStore.setState({ language: parsedLanguage.data });
  }

  if (parsedRpcs3Path.success) {
    useStore.setState({ rpcs3Path: parsedRpcs3Path.data });
  }

  useStore.setState({ _hydrated: true });

  console.log("Settings loaded:", await appConfigDir())
};

hydrate();