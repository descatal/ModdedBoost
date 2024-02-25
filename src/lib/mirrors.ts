import {updateMetadata} from "@/lib/remote.ts";
import {resolveResource} from "@tauri-apps/api/path";
import {readTextFile} from "@tauri-apps/plugin-fs";

export type Mirrors = {
  mirrorGroups: MirrorGroup[],
};

export type MirrorGroup = {
  name: string,
  remotes: Remotes[]
};

export type Remotes = {
  name: string,
  rcloneName: string
}

export async function loadMirrors(getRemote: boolean) {
  if (getRemote) await updateMetadata();

  const resourcePath = await resolveResource('resources/mirrors.json')
  const mirrors: Mirrors = JSON.parse(await readTextFile(resourcePath))

  return { ...mirrors } as Mirrors;
}