import {Store} from "tauri-plugin-store-api";
import {DEFAULT_LANGUAGE, DEFAULT_THEME} from "@/lib/constants.ts";
import {create} from "zustand";
import {z} from "zod";
import i18n from "i18next";
import {appConfigDir, resourceDir} from "@tauri-apps/api/path";

const tauriStore = new Store(".settings.dat");
const storageKey = "vite-ui-theme";

type Theme = "dark" | "light" | "system"

export interface ConfigStore {
  theme: Theme;
  language: string;
  rpcs3Path: string;
  filesMetadataCache: {
    path: string,
    lastModifiedEpoch: number,
    md5: string
  }[];
  setTheme: (theme: Theme) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  setRpcs3Path: (rpcs3Path: string) => Promise<void>;
  setFilesMetadataCache: (fileMetadata: { path: string, lastModifiedEpoch: number, md5: string }[]) => Promise<void>;
  _hydrated: boolean;
}

export const useConfigStore = create<ConfigStore>()((set) => ({
  theme: (localStorage.getItem(storageKey) as Theme) || DEFAULT_THEME,
  language: i18n.language || DEFAULT_LANGUAGE,
  rpcs3Path: "",
  filesMetadataCache: [],
  setTheme: async (theme) => {
    set({theme: theme});
    localStorage.setItem(storageKey, theme);
    await tauriStore.set("theme", theme);
    await tauriStore.save();
  },
  setLanguage: async (language) => {
    set({language: language});
    await tauriStore.set("language", language);
    await tauriStore.save();
  },
  setRpcs3Path: async (rpcs3Path) => {
    set({rpcs3Path: rpcs3Path});
    await tauriStore.set("rpcs3_path", rpcs3Path);
    await tauriStore.save();
  },
  setFilesMetadataCache: async (fileMetadata: { path: string, lastModifiedEpoch: number, md5: string }[]) => {
    set({filesMetadataCache: fileMetadata});
    await tauriStore.set("file_metadata", fileMetadata);
    await tauriStore.save();
  },
  _hydrated: false,
}));

const hydrate = async () => {
  const theme = await tauriStore.get("theme");
  const language = await tauriStore.get("language");
  const rpcs3Path = await tauriStore.get("rpcs3_path");
  const fileMetadataPath = await tauriStore.get("file_metadata");

  const parsedTheme = z.enum(["dark", "light", "system"]).safeParse(theme);
  const parsedLanguage = z.string().safeParse(language);
  const parsedRpcs3Path = z.string().safeParse(rpcs3Path);

  const storeFileMetadataSchema = z.object({
    path: z.string(),
    lastModifiedEpoch: z.number(),
    md5: z.string()
  })
  const parsedFileMetadataPath = z.array(storeFileMetadataSchema).safeParse(fileMetadataPath);

  if (parsedTheme.success) {
    useConfigStore.setState({theme: parsedTheme.data});
  }

  if (parsedLanguage.success) {
    useConfigStore.setState({language: parsedLanguage.data});
  }

  if (parsedRpcs3Path.success) {
    useConfigStore.setState({rpcs3Path: parsedRpcs3Path.data});
  }

  if (parsedFileMetadataPath.success) {
    useConfigStore.setState({filesMetadataCache: parsedFileMetadataPath.data});
  }

  useConfigStore.setState({_hydrated: true});

  console.log("Settings loaded:", await appConfigDir())
  console.log("Resource loaded:", await resourceDir())
};

hydrate();