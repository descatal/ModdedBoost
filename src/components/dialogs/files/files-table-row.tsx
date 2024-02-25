import {TableCell, TableRow} from "@/components/ui/table.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import TooltipComponent from "@/components/common/tooltip-component.tsx";
import {DownloadIcon} from "@radix-ui/react-icons";
import {useTranslation} from "react-i18next";
import {basename} from "@tauri-apps/api/path";
import {useEffect, useState} from "react";
import {Progress} from "@/components/ui/progress.tsx";
import IconButton from "@/components/common/icon-button.tsx";
import {ProgressType, useProcessListStore} from "@/lib/store/process.ts";
import {throttle} from "lodash"
import {Files} from "@/components/game-tabs.tsx";
import {getCurrent} from '@tauri-apps/api/window';
import {invoke} from "@tauri-apps/api/core";
// @ts-ignore
import crc32 from "crc32";

type FilesTableRowProp = {
  file: Files
}

interface ProgressPayload {
  id: number;
  progress: number;
  total: number;
}

type ProgressHandler = (progress: number, total: number) => void;

async function listenToEventIfNeeded(event: string, progressHandler: ProgressHandler): Promise<void> {
  await getCurrent().listen<ProgressPayload>(event, ({payload}) => {
    progressHandler(payload.progress, payload.total);
  });
}

const FilesTableRow = ({file}: FilesTableRowProp) => {
  const {t} = useTranslation();
  const [fileName, setFileName] = useState("")

  const addOrUpdateProcess = useProcessListStore.getState().addOrUpdateProcess
  const {processList} = useProcessListStore()
  const filePath = file.path
  const id = parseInt(crc32(filePath), 16)
  const process = processList.find(p => p.id === id)

  const throttleFunc = throttle((progress: number, total: number) => {
    if (!process)
      return
      
    const percentage = (progress / total) * 100
    let downloadStatus = ProgressType[process.type] + "ing" // lol
    if (progress === total)
      downloadStatus = "Complete"

    addOrUpdateProcess({
      ...process,
      progress: progress,
      total: total,
      percentage: percentage,
      status: downloadStatus
    })
  }, 1000);
  
  // Throttled function for updating the process
  const progressHandler = (progress: number, total: number) => {
    throttleFunc(progress, total)
  };
  
  useEffect(() => {
    const subscribeToProcessListener = async () => {
      if (process && process.type === ProgressType.Download) {
        await listenToEventIfNeeded(`download://progress/${id}`, progressHandler);
      }
    }
    subscribeToProcessListener().catch(console.error)
  }, []);

  const startDownload = async () => {
    const downloadUrl = file.remoteGroups.get('normal')
    if (!downloadUrl)
      return
    
    // Create a new process for this download
    const newProcess = {
      id: id,
      status: 'Downloading',
      name: fileName,
      type: ProgressType.Download,
      progress: 0,
      total: 0,
      percentage: 0,
    };
    addOrUpdateProcess(newProcess);
    await listenToEventIfNeeded(`download://progress/${id}`, progressHandler);

    // Start the download
    await invoke("custom_downloader", {
      id: id,
      url: downloadUrl[0],
      filePath: filePath,
      headers: {},
    });
  };
  
  useEffect(() => {
    const getFileName = async () => {
      const fileName = await basename(file.path)
      setFileName(fileName)
    }

    getFileName().catch(console.error)
  }, [fileName]);

  return (
    <TableRow>
      <TableCell className={"text-center"}>
        <TooltipComponent triggerContent={<p>{fileName}</p>} tooltipContent={file.path}/>
      </TableCell>
      <TableCell>
        <div className="flex gap-2 justify-center">
          {/*<Badge className="w-[30%] justify-center" variant="secondary">{file.type}</Badge>*/}
          {/*<Badge className={`${isValid ? "bg-green-500" : ""} w-[50%] justify-center`}*/}
          {/*       variant={isValid ? "default" : "destructive"}>{actualFileVersion}</Badge>*/}
        </div>
      </TableCell>
      <TableCell className={"hidden sm:block"}>
        {process ?
          <div className={"flex flex-col"}>
            <div className={"flex justify-between"}>
              <p className={`${process.percentage <= 0 ? "hidden" : ""}`}>{process.status}</p>
              <p className={`${process.percentage <= 0 ? "hidden" : ""}`}>{Math.floor(process.percentage)} %</p>
            </div>
            <Progress value={process.percentage}/>
          </div>
          : "-"}
      </TableCell>
      <TableCell className={"text-center"}>
        <IconButton
          buttonDescription={t("Update")}
          tooltipContent={t("Update to the latest version")}
          buttonIcon={<DownloadIcon/>}
          onClick={startDownload}/>
      </TableCell>
    </TableRow>
  );
};

export default FilesTableRow;