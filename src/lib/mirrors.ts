import {updateMetadata} from "@/lib/remote.ts";
import {resolveResource} from "@tauri-apps/api/path";
import {readTextFile} from "@tauri-apps/api/fs";

export type Mirrors = {
  mirrors: MirrorGroup[],
};

export type MirrorGroup = {
  groups: string[],
  files: RemoteFiles[]
};

export type RemoteFiles = {
  identifier: string,
  remotes: string[]
}

export async function loadMirrors(getRemote: boolean) {
  if (getRemote) await updateMetadata();

  const resourcePath = await resolveResource('resources/mirrors.json')
  const mirrors: Mirrors = JSON.parse(await readTextFile(resourcePath))

  return { ...mirrors } as Mirrors;
}

export function concatMirrors(mirrors: Mirrors) {
  const mirrorsMap = new Map<string, RemoteFiles[]>;

  mirrors.mirrors.forEach(item => {
    item.groups.forEach(g => {
      const existingFiles = mirrorsMap.get(g) ?? []
      item.files.forEach(file => existingFiles.push(file)) 
      mirrorsMap.set(g, existingFiles)
    })
  });
  return mirrorsMap
}