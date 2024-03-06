import {Button} from '../../ui/button.tsx';
import React, {useEffect, useState} from "react";
import {Table, TableBody, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {useTranslation} from "react-i18next";
import FilesTableRow from "@/components/dialogs/files/files-table-row.tsx";
import {UpdateIcon} from "@radix-ui/react-icons";
import {
  Drawer, DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer.tsx";
import IconButton from "@/components/common/icon-button.tsx";
import {loadMetadata, ModFiles} from "@/lib/metadata.ts";
import {MirrorGroupToggle} from "@/components/common/title-bar/mirror-group-toggle.tsx";
import {invoke} from "@tauri-apps/api/core";
import {LocalFileMetadata, useAppStore} from "@/lib/store/app.ts";
import {toast} from "sonner";
import i18n from "i18next";

interface FileDialogsProps {
  gameId: string;
  modVersion: string,
  files: ModFiles[];
  triggerContent: React.ReactNode;
}

const FilesDialog = ({gameId, modVersion, files, triggerContent}: FileDialogsProps) => {
  const {t} = useTranslation();
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
  const {localMetadata, setLocalMetadata, setLoadedMetadata, isRefreshing, setIsRefreshing} = useAppStore()
  
  const checkUpdates = async () => {
    setIsCheckingUpdates(true)
    toast.info(i18n.t("Fetching updates from remote..."));
    const loadedMetadata = await loadMetadata(true)
    setLoadedMetadata(loadedMetadata)
    toast.success(i18n.t("Fetch complete."));
    setIsCheckingUpdates(false)
  }

  const getFileMetadata = async (showToast: boolean) => {
    setIsRefreshing(true)
    if (showToast) toast.info(i18n.t("Refreshing local files..."));
    const actualFilePaths = files.map((item) => item.path)
    const realFileMetadata = await invoke<LocalFileMetadata[]>("get_file_metadata_command", {
      filePaths: actualFilePaths
    })
    setLocalMetadata(realFileMetadata)
    if (showToast) toast.success(i18n.t("Refresh complete."));
    setIsRefreshing(false)
  }
  
  useEffect(() => {
    getFileMetadata(false).catch(console.error)
  }, [files])
  
  return (
    <Drawer>
      <DrawerTrigger asChild>
        {triggerContent}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85%] min-w-full">
        <DrawerHeader>
          <DrawerTitle>Game Files</DrawerTitle>
          <DrawerDescription>
            {t("Game Version")}: {gameId}
          </DrawerDescription>
          <DrawerDescription>
            {t("Mod Version")}: {modVersion}
          </DrawerDescription>
          <div className="flex gap-1 justify-end">
            <MirrorGroupToggle buttonVariant={"outline"} breakpoint={"none"}/>
            <IconButton
              isLoading={isCheckingUpdates}
              buttonDescription={t("Check for updates")}
              tooltipContent={t("Fetch data from remote")}
              buttonIcon={<UpdateIcon/>}
              onClick={ async () => {
                await checkUpdates()
              }}/>
            <IconButton
              isLoading={isRefreshing}
              buttonDescription={t("Refresh")}
              tooltipContent={t("Re-check local file status")}
              buttonIcon={<UpdateIcon/>}
              onClick={ async () => {
                await getFileMetadata(true)
              }}/>
          </div>
        </DrawerHeader>
        <div className={"h-[100%] relative overflow-auto"}>
          <Table className="border shadow-sm rounded-lg">
            <TableHeader className={"sticky -top-0.5 bg-secondary z-10"}>
              <TableRow>
                <TableHead className="text-center w-[150px]">File Name</TableHead>
                <TableHead className="text-center w-[200px]">Local MD5</TableHead>
                <TableHead className="text-center w-[200px]">Status</TableHead>
                {/*<TableHead className="text-center hidden sm:flex justify-center items-center">Progress</TableHead>*/}
                <TableHead className="text-center w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files ? files.map(item => {
                return <FilesTableRow
                  key={item.path}
                  readFileMetadata={localMetadata.find(actual => actual.path === item.path)}
                  file={item}/>
                }) : <></>
              }
            </TableBody>
          </Table>
        </div>
        <DrawerFooter>
          <DrawerClose>
            <Button className={"w-full"}>{t("Close")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FilesDialog;