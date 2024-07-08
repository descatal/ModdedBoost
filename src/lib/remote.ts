import {appDataDir, join, resolveResource} from "@tauri-apps/api/path";
import {readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";
import {invoke} from "@tauri-apps/api/core";
import {Mirrors} from "@/lib/mirrors.ts";
import {Metadata} from "@/lib/metadata.ts";
import {useConfigStore} from "@/lib/store/config.ts";

type Remote = {
  metadata: string
  mirrors: string,
  rcloneConf: string
}

export async function updateMetadata(fetchRemote: boolean) {
  const { beta} = useConfigStore.getState()
  const remoteJson = beta ? "resources/remote-beta.json" : "resources/remote.json";
  const metadataJson = beta ? "metadata-beta.json" : "metadata.json";

  const resourcePath = await resolveResource(`resources/${metadataJson}`)
  const metadataPath = await join(await appDataDir(), metadataJson);

  const resourceExist = await invoke("check_path_exist", {
    fullPath: metadataPath
  })

  // At least have a copy if there's no existing resource file
  if (!resourceExist) {
    const metadata: Metadata = JSON.parse(await readTextFile(resourcePath))
    await writeTextFile(metadataPath, JSON.stringify(metadata));
  }

  if (fetchRemote) {
    const remotePath = await resolveResource(remoteJson)
    const remote: Remote = JSON.parse(await readTextFile(remotePath))
    const metadataJson = await fetch(remote.metadata, {cache: "no-cache"}).then((res) => res.json()).catch(err => console.error(err))
    await writeTextFile(metadataPath, JSON.stringify(metadataJson));
  }
}

export async function updateMirrors(fetchRemote: boolean) {
  const { beta} = useConfigStore.getState()
  const remoteJson = beta ? "resources/remote-beta.json" : "resources/remote.json";
  const mirrorsJson = beta ? "mirrors-beta.json" : "mirrors.json";
  
  const resourcePath = await resolveResource(`resources/${mirrorsJson}`)
  const mirrorsPath = await join(await appDataDir(), mirrorsJson);

  const resourceExist = await invoke("check_path_exist", {
    fullPath: mirrorsPath
  })

  // At least have a copy if there's no existing resource file
  if (!resourceExist) {
    const mirrors: Mirrors = JSON.parse(await readTextFile(resourcePath))
    await writeTextFile(mirrorsPath, JSON.stringify(mirrors));
  }

  if (fetchRemote) {
    const remotePath = await resolveResource(remoteJson)
    const remote: Remote = JSON.parse(await readTextFile(remotePath))
    const metadataJson = await fetch(remote.mirrors, {cache: "no-cache"}).then((res) => res.json()).catch(err => console.error(err))
    await writeTextFile(mirrorsPath, JSON.stringify(metadataJson));
  }
}

export async function updateRcloneConf(fetchRemote: boolean) {
  const { beta} = useConfigStore.getState()
  const remoteJson = beta ? "resources/remote-beta.json" : "resources/remote.json";

  const resourcePath = await resolveResource('resources/tools/rclone/rclone.conf')
  const rcloneConfPath = await join(await appDataDir(), 'tools/rclone/rclone.conf');
  
  const resourceExist = await invoke("check_path_exist", {
    fullPath: rcloneConfPath
  })
  
  // At least have a copy if there's no existing resource file
  if (!resourceExist) {
    const confContent = await readTextFile(resourcePath)
    await writeTextFile(rcloneConfPath, confContent);
  }

  if (fetchRemote) {
    const remotePath = await resolveResource(remoteJson)
    const remote: Remote = JSON.parse(await readTextFile(remotePath))
    const confContent = await fetch(remote.rcloneConf, {cache: "no-cache"})
      .then(res => res.text())
      .catch(err => console.error(err)) ?? "";
    await writeTextFile(rcloneConfPath, confContent);
  }
}
