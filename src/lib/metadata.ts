import {resolveResource} from "@tauri-apps/api/path";
import {readTextFile} from "@tauri-apps/plugin-fs";
import {updateMetadata} from "@/lib/remote.ts";

export async function loadMetadata(getRemote: boolean) {
  if (getRemote) await updateMetadata();

  const resourcePath = await resolveResource('resources/metadata.json')
  const metadata: Metadata = JSON.parse(await readTextFile(resourcePath))
  
  return metadata
}

export async function replaceGameId(metadata: Metadata, gameId: string) {
  metadata.base.path = replaceGameIdInternal(metadata.base.path, gameId)
  metadata.base.remotePath = replaceGameIdInternal(metadata.base.path, gameId)
  metadata.mod.files = metadata.mod.files.map(item => {
    item.path = replaceGameIdInternal(metadata.base.path, gameId)
    item.remotePath = replaceGameIdInternal(metadata.base.path, gameId)
    return item
  });
  
  return metadata
}

function replaceGameIdInternal(str: string, gameId: string) {
  return str.replace('{GAME_ID}', gameId);
}

export type Metadata = {
  base: SyncBase,
  mod: SyncMod
}

export type SyncBase = {
  path: string, 
  remotePath: string,
  excludePaths: string[]
}

export type SyncMod = {
  modVersion: string,
  files: ModFiles[]
}

export type ModFiles = {
  name: string,
  path: string,
  remotePath: string,
  md5: string,
}