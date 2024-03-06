import {join, resolveResource} from "@tauri-apps/api/path";
import {readTextFile} from "@tauri-apps/plugin-fs";
import {updateMetadata} from "@/lib/remote.ts";
import {cloneDeep} from "lodash";

export async function loadMetadata(getRemote: boolean) {
  if (getRemote) await updateMetadata();

  const resourcePath = await resolveResource('resources/metadata.json')
  const metadata: Metadata = JSON.parse(await readTextFile(resourcePath))

  return metadata
}

export async function transformPaths(rpcs3Directory: string, metadata: Metadata, gameId: string) {
  const clonedMetadata = cloneDeep(metadata)
  clonedMetadata.base.path = await join(rpcs3Directory, replaceGameIdInternal(clonedMetadata.base.path, gameId))
  clonedMetadata.base.remotePath = replaceGameIdInternal(clonedMetadata.base.remotePath, gameId)
  clonedMetadata.mod.files = await Promise.all(clonedMetadata.mod.files.map(async (item) => {
    item.path = await join(rpcs3Directory, replaceGameIdInternal(item.path, gameId))
    item.remotePath = replaceGameIdInternal(item.remotePath, gameId)
    return item
  }));
  
  return clonedMetadata
}

function replaceGameIdInternal(str: string, gameId: string) {
  return str.replace('{GAME_ID}', gameId);
}

export type GameVersions = "NPJB00512" | "BLJS10250"

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
  versions: GameVersions[]
  name: string,
  path: string,
  remotePath: string,
  md5: string,
  type: "file" | "psarc"
}