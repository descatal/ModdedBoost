import {TableCell, TableRow} from "@/components/ui/table.tsx";
import TooltipComponent from "@/components/common/tooltip-component.tsx";
import {DownloadIcon} from "@radix-ui/react-icons";
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import IconButton from "@/components/common/icon-button.tsx";
import {ProcessProps, useProcessListStore} from "@/lib/store/process.ts";
import {isEqual} from "lodash"
import {ModFiles} from "@/lib/metadata.ts";
import {Badge} from "@/components/ui/badge.tsx";
import {LocalFileMetadata, useAppStore} from "@/lib/store/app.ts";
import {updateFiles} from "@/lib/update.ts";
import {toast} from "sonner";
import i18n from "i18next";

interface FilesTableRowProps {
  file: ModFiles
  localFileMetadata: LocalFileMetadata | undefined
}

const FilesTableRow = ({file, localFileMetadata}: FilesTableRowProps) => {
  const fileProcessId = `FileProcess_${file.name}`;
  const defaultFileProcess: ProcessProps = {
    id: fileProcessId,
    status: "Finished",
    name: fileProcessId,
    type: "Check",
    progress: 0,
    total: 0,
    percentage: 0
  }
  const {t} = useTranslation();
  const {processes} = useProcessListStore();
  const {isRefreshing} = useAppStore();
  const [fileProcess, setFileProcess] = useState(defaultFileProcess)
  const [isSyncingFileProcess, setIsSyncingFileProcess] = useState(false)
  const [isLatest, setIsLatest] = useState(false)

  useEffect(() => {
    setIsLatest(file.md5 === localFileMetadata?.checksum)
  }, [file, localFileMetadata])
  
  useEffect(() => {
    const newFileProcess = processes.find(process => process.id === fileProcessId)
    if (newFileProcess && !isEqual(newFileProcess, fileProcess)) {
      if (newFileProcess.status.toLocaleLowerCase() === "started") {
        setIsSyncingFileProcess(true)
      } else if (newFileProcess.status.toLocaleLowerCase() === "finished") {
        setIsSyncingFileProcess(false)
      }
      setFileProcess(newFileProcess)
    }
  }, [processes])

  return (
    <TableRow>
      <TableCell className={"text-center"}>
        <TooltipComponent triggerContent={<p>{file.name}</p>} tooltipContent={file.path}/>
      </TableCell>
      <TableCell>
        <div className="flex gap-2 justify-center">
          {localFileMetadata ? localFileMetadata.checksum : t("Not Found")}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-2 justify-center">
          <Badge className={`${isLatest ? "bg-green-500" : ""} w-[50%] justify-center`}
                 variant={isLatest ? "default" : "destructive"}>
            {isLatest ? t("Latest") : t("Outdated")}
          </Badge>
        </div>
      </TableCell>
      <TableCell className={"text-center"}> {
        !isLatest ?
          <IconButton
            isLoading={isSyncingFileProcess || isRefreshing}
            buttonDescription={t("Update")}
            tooltipContent={t("Update to the latest version")}
            buttonIcon={<DownloadIcon/>}
            onClick={ async () => {
              const loadingToastId = toast.loading(i18n.t("Updating, this might take a while..."));
              await updateFiles(fileProcess, file)
              toast.dismiss(loadingToastId)
              toast.info(i18n.t("Update complete!"));
            }}/>
          : "-"
      }
      </TableCell>
    </TableRow>
  );
};

export default FilesTableRow;