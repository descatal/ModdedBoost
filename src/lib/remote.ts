import {resolveResource} from "@tauri-apps/api/path";
import {readTextFile, writeTextFile} from "@tauri-apps/api/fs";

type Remote = {
  metadata: string
  mirrors: string
}

export async function updateMetadata(){
  const resourcePath = await resolveResource('resources/remote.json')
  const remote : Remote = JSON.parse(await readTextFile(resourcePath))
  
  const metadataJson = await fetch(remote.metadata).then((res) => res.json())
  const metadataPath = await resolveResource('resources/metadata.json')
  await writeTextFile(metadataPath, JSON.stringify(metadataJson));
}

export async function updateMirrors(){
  const resourcePath = await resolveResource('resources/mirrors.json')
  const remote : Remote = JSON.parse(await readTextFile(resourcePath))

  const metadataJson = await fetch(remote.metadata).then((res) => res.json())
  const metadataPath = await resolveResource('resources/mirrors.json')
  await writeTextFile(metadataPath, JSON.stringify(metadataJson));
}
