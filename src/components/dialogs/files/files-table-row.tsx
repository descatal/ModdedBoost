import {TableCell, TableRow} from "@/components/ui/table.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import TooltipComponent from "@/components/common/tooltip-component.tsx";
import {DownloadIcon} from "@radix-ui/react-icons";
import {useTranslation} from "react-i18next";
import {basename} from "@tauri-apps/api/path";
import {useEffect, useState} from "react";
import FileSelectIconButton from "@/components/common/file-select-icon-button.tsx";
import {Progress} from "@/components/ui/progress.tsx";
import IconButton from "@/components/common/icon-button.tsx";
import {ProcessProps, useProcessListStore} from "@/lib/store/process.ts";
import _ from "lodash"
import {download} from "tauri-plugin-upload-api";
import {Files} from "@/components/config.tsx";
import {Simulate} from "react-dom/test-utils";
import progress = Simulate.progress;

type FilesTableRowProp = {
  modVersion: string
  gameVersion: string
  actualFileVersion: string
  file: Files
}

const FilesTableRow = ({modVersion, gameVersion, actualFileVersion, file}: FilesTableRowProp) => {
  const {t} = useTranslation();
  const [fileName, setFileName] = useState("")
  const isValid = file.type === "Mod" ? modVersion == actualFileVersion : gameVersion == actualFileVersion;

  const addOrUpdateProcess = useProcessListStore.getState().addOrUpdateProcess
  const [isDownloading, setIsDownloading] = useState(false);
  const {processList} = useProcessListStore()
  const process = processList.find(p => p.id === file.path)
  
  console.log("Is-rendering")

  const startDownload = async () => {
    const downloadUrl = file.remoteGroups.get('normal')
    if (!downloadUrl)
      return

    // setIsDownloading(true);

    // Create a new process for this download
    const newProcess = {
      id: file.path, // Replace with actual id
      status: 'Downloading',
      name: fileName, // Replace with actual name
      progress: 0,
      total: 100, // Replace with actual total
      percentage: 0,
    };
    addOrUpdateProcess(newProcess);

    let accumulatedProgress = 0;
    let totalSize = 0;
    // Create a throttled function for updating the download progress
    const throttledUpdate = _.throttle(() => {
      const newProgress = newProcess.progress += accumulatedProgress
      const percentage = (newProgress / totalSize) * 100
      addOrUpdateProcess({
        ...newProcess,
        progress: newProgress,
        total: totalSize,
        percentage: percentage
      })
      // updateProgress(newProcess.id, accumulatedProgress, totalSize);
      accumulatedProgress = 0;
    }, 1000);

    // Start the download
    await download(
      downloadUrl[0],
      file.path,
      (progress, total) => {
        accumulatedProgress += progress;
        totalSize = total
        throttledUpdate()
      },
      {"Content-Type": "text/plain"},
    );

    // setIsDownloading(false);
  };

  useEffect(() => {
    const getFileName = async () => {
      const fileName = await basename(file.path)
      setFileName(fileName)
    }

    getFileName().catch(console.error)
  }, [fileName]);

  const selectFile = async (selectedPath: string | string[] | null) => {
    // user selected multiple files or cancelled the selection
    if (Array.isArray(selectedPath) || selectedPath === null) return;
  };

  return (
    <TableRow>
      <TableCell className={"text-center"}>
        <TooltipComponent triggerContent={<p>{fileName}</p>} tooltipContent={file.path}/>
      </TableCell>
      <TableCell>
        <div className="flex gap-2 justify-center">
          <Badge className="w-[30%] justify-center" variant="secondary">{file.type}</Badge>
          <Badge className={`${isValid ? "bg-green-500" : ""} w-[50%] justify-center`}
                 variant={isValid ? "default" : "destructive"}>{actualFileVersion}</Badge>
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
        <div className="flex gap-2 justify-center">
          <IconButton
            buttonDescription={t("Update")}
            tooltipContent={t("Update to the latest version")}
            buttonIcon={<DownloadIcon/>}
            onClick={startDownload}/>
          <FileSelectIconButton
            multiple={false}
            tooltipContent={t("Select an existing file")}
            defaultPath={file.path}
            directory={false}
            buttonDescription={t("Locate file")}
            onFilesSelected={selectFile}/>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default FilesTableRow;