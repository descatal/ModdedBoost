import {updateMirrors} from "@/lib/remote.ts";
import {resolveResource} from "@tauri-apps/api/path";
import {readTextFile} from "@tauri-apps/plugin-fs";
import {useConfigStore} from "@/lib/store/config.ts";

export type Mirrors = {
  mirrorGroups: MirrorGroup[],
};

export type MirrorGroup = {
  testUrl: string,
  name: string,
  remotes: Remotes[]
};

export type Remotes = {
  name: string,
  rcloneName: string
}

export async function loadMirrors(getRemote: boolean) {
  await updateMirrors(getRemote);
  
  const { beta} = useConfigStore.getState()
  const mirrorsJson = beta ? "mirrors-beta.json" : "mirrors.json";

  const resourcePath = await resolveResource(`resources/${mirrorsJson}`)
  const mirrors: Mirrors = JSON.parse(await readTextFile(resourcePath))

  return { ...mirrors } as Mirrors;
}