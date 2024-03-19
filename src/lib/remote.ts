import {appConfigDir, join, resolveResource} from "@tauri-apps/api/path";
import {readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";
import {invoke} from "@tauri-apps/api/core";
import {error} from "@tauri-apps/plugin-log";
import {Mirrors} from "@/lib/mirrors.ts";
import {Metadata} from "@/lib/metadata.ts";

type Remote = {
  metadata: string
  mirrors: string,
  rcloneConf: string
}

export async function updateMetadata(fetchRemote: boolean) {
  const resourcePath = await resolveResource('resources/remote.json')
  const metadataPath = await join(await appConfigDir(), 'metadata.json');

  const resourceExist = await invoke("check_path_exist", {
    fullPath: metadataPath
  })

  // At least have a copy if there's no existing resource file
  if (!resourceExist) {
    const metadata: Metadata = JSON.parse(await readTextFile(resourcePath))
    await writeTextFile(metadataPath, JSON.stringify(metadata));
  }

  if (fetchRemote) {
    const remotePath = await resolveResource('resources/remote.json')
    const remote: Remote = JSON.parse(await readTextFile(remotePath))
    const metadataJson = await fetch(remote.metadata, {cache: "no-cache"}).then((res) => res.json()).catch(err => console.error(err))
    await writeTextFile(metadataPath, JSON.stringify(metadataJson));
  }
}

export async function updateMirrors(fetchRemote: boolean) {
  const resourcePath = await resolveResource('resources/mirrors.json')
  const mirrorsPath = await join(await appConfigDir(), 'mirrors.json');

  const resourceExist = await invoke("check_path_exist", {
    fullPath: mirrorsPath
  })

  // At least have a copy if there's no existing resource file
  if (!resourceExist) {
    const mirrors: Mirrors = JSON.parse(await readTextFile(resourcePath))
    await writeTextFile(mirrorsPath, JSON.stringify(mirrors));
  }

  if (fetchRemote) {
    const remotePath = await resolveResource('resources/remote.json')
    const remote: Remote = JSON.parse(await readTextFile(remotePath))
    const metadataJson = await fetch(remote.mirrors, {cache: "no-cache"}).then((res) => res.json()).catch(err => console.error(err))
    await writeTextFile(mirrorsPath, JSON.stringify(metadataJson));
  }
}

export async function updateRcloneConf(fetchRemote: boolean) {
  const resourcePath = await resolveResource('resources/tools/rclone/rclone.conf')
  const rcloneConfPath = await join(await appConfigDir(), 'tools/rclone/rclone.conf');
  
  const resourceExist = await invoke("check_path_exist", {
    fullPath: rcloneConfPath
  })

  // At least have a copy if there's no existing resource file
  if (!resourceExist) {
    const confContent = await readTextFile(resourcePath)
    await writeTextFile(rcloneConfPath, confContent);
  }

  if (fetchRemote) {
    const remotePath = await resolveResource('resources/remote.json')
    const remote: Remote = JSON.parse(await readTextFile(remotePath))
    const confContent = await fetch(remote.rcloneConf, {cache: "no-cache"})
      .then(res => res.text())
      .catch(err => console.error(err)) ?? "";
    await writeTextFile(rcloneConfPath, confContent);
  }
}
