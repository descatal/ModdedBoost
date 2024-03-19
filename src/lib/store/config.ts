import {DEFAULT_LANGUAGE, DEFAULT_THEME} from "@/lib/constants.ts";
import {z} from "zod";
import i18n from "i18next";
import {appConfigDir, resourceDir} from "@tauri-apps/api/path";
import {Store} from "@tauri-apps/plugin-store";
import {createWithEqualityFn} from "zustand/traditional";
import {MirrorGroup} from "@/lib/mirrors.ts";

const tauriStore = new Store(".settings.dat");
const storageKey = "vite-ui-theme";

type Theme = "dark" | "light" | "system"

export interface ConfigStore {
  theme: Theme;
  language: string;
  rpcs3Path: string;
  mirrorGroup: MirrorGroup;
  filesMetadataCache: {
    path: string,
    lastModifiedEpoch: number,
    md5: string
  }[];
  lastSelectedTab: string,
  setTheme: (theme: Theme) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  setRpcs3Path: (rpcs3Path: string) => Promise<void>;
  setFilesMetadataCache: (fileMetadata: { path: string, lastModifiedEpoch: number, md5: string }[]) => Promise<void>;
  setMirrorGroup: (mirrorGroup: MirrorGroup) => Promise<void>;
  setLastSelectedTab: (selectedTab: string) => Promise<void>;
  _hydrated: boolean;
}

export const useConfigStore = createWithEqualityFn<ConfigStore>()((set) => ({
  theme: (localStorage.getItem(storageKey) as Theme) || DEFAULT_THEME,
  language: i18n.language || DEFAULT_LANGUAGE,
  rpcs3Path: "",
  filesMetadataCache: [],
  mirrorGroup: {
    testUrl: "",
    name: "",
    remotes: []
  },
  lastSelectedTab: "",
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
  setMirrorGroup: async (mirrorGroup) => {
    set({mirrorGroup: mirrorGroup});
    await tauriStore.set("mirror_group", mirrorGroup);
    await tauriStore.save();
  },
  setLastSelectedTab: async (selectedTab) => {
    set({lastSelectedTab: selectedTab});
    await tauriStore.set("lastSelectedTab", selectedTab);
    await tauriStore.save();
  },

  _hydrated: false,
}));

const hydrate = async () => {
  const theme = await tauriStore.get("theme");
  const language = await tauriStore.get("language");
  const rpcs3Path = await tauriStore.get("rpcs3_path");
  const fileMetadataPath = await tauriStore.get("file_metadata");
  const mirrorGroup = await tauriStore.get("mirror_group");
  const lastSelectedTab = await tauriStore.get("lastSelectedTab");

  const parsedTheme = z.enum(["dark", "light", "system"]).safeParse(theme);
  const parsedLanguage = z.string().safeParse(language);
  const parsedRpcs3Path = z.string().safeParse(rpcs3Path);
  const parsedMirrorGroup = z.custom<MirrorGroup>().safeParse(mirrorGroup);
  const parsedLastSelectedTab = z.string().safeParse(lastSelectedTab);

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

  if (parsedMirrorGroup.success) {
    useConfigStore.setState({mirrorGroup: parsedMirrorGroup?.data ?? {name: "-", remotes: []}});
  }
  
  if (parsedLastSelectedTab.success) {
    useConfigStore.setState({lastSelectedTab: parsedLastSelectedTab.data});
  }
  
  useConfigStore.setState({_hydrated: true});
};

hydrate().then(async () => {
  console.log("Settings loaded:", await appConfigDir())
  console.log("Resource loaded:", await resourceDir())
});