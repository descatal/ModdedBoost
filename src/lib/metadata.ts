import {join, resolveResource} from "@tauri-apps/api/path";
import {readTextFile} from "@tauri-apps/api/fs";
import {updateMetadata} from "@/lib/remote.ts";

export type Metadata = {
  latestModVersion: string,
  latestGameVersion: string,
  modFiles: FileMetadata[],
  originalFiles: FileMetadata[]
}

export type FileMetadata = {
  gameTypes: string[],
  remote: Remote,
  path: string,
  md5: Md5[]
}

export type Md5 = {
  version: string,
  value: string
}

export type Remote = {
  identifiers: string[],
  process: string[],
  innerPath: string
}

const parseMetadata = async (list: FileMetadata[], gameId: string, latestVersion: string, rpcs3Directory: string) => {
  const files: FileMetadata[] = [];
  await Promise.all(
    list.map(async item => {
      const isGameType = item.gameTypes.some(item => item.toLocaleLowerCase() === gameId.toLocaleLowerCase());
      if (isGameType) {
        const newMd5 = item.md5.map(md5Item => ({
          ...md5Item,
          version: md5Item.version.replace('latest', latestVersion)
        }))
        const newItem = {
          ...item,
          md5: newMd5,
          path: await join(rpcs3Directory, item.path.replace('{GAME_ID}', gameId)),
        }
        files.push(newItem);
      }
    }));
  return files
}

export async function loadMetadata(getRemote: boolean, gameId: string, rpcs3Directory: string) {
  if (getRemote) await updateMetadata();

  const resourcePath = await resolveResource('resources/metadata.json')
  const metadata: Metadata = JSON.parse(await readTextFile(resourcePath))
  return {
    ...metadata,
    originalFiles: await parseMetadata(metadata.originalFiles, gameId, metadata.latestGameVersion, rpcs3Directory),
    modFiles: await parseMetadata(metadata.modFiles, gameId, metadata.latestModVersion, rpcs3Directory),
  } as Metadata
}

export function concatMetadata(metadata: Metadata) {
  const uniqueItems: [string, FileMetadata][] = [];
  const uniquePathsSet: Set<string> = new Set();
  const addUnique = (list: FileMetadata[], type: string) => {
    list.forEach(item => {
      const isUnique = !uniquePathsSet.has(item.path);
      if (isUnique) {
        uniquePathsSet.add(item.path);
        uniqueItems.push([type, item]);
      }
    });
  };

  addUnique(metadata.originalFiles, 'Original');
  addUnique(metadata.modFiles, 'Mod');

  return Array.from(uniqueItems);
}
