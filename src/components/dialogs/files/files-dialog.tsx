import {Button} from '../../ui/button.tsx';
import React, {useState} from "react";
import {Table, TableBody, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {useTranslation} from "react-i18next";
import FilesTableRow from "@/components/dialogs/files/files-table-row.tsx";
import {ChevronDownIcon, UpdateIcon} from "@radix-ui/react-icons";
import {
  Drawer,
  DrawerClose,
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
import {useAppStore} from "@/lib/store/app.ts";
import {toast} from "sonner";
import i18n from "i18next";
import {refreshAllLocalMetadata} from "@/lib/update.ts";
import {Separator} from "@/components/ui/separator.tsx";
import {DropdownMenu, DropdownMenuContent, DropdownMenuTrigger} from "@/components/ui/dropdown-menu.tsx";
import {LuRefreshCcwDot} from "react-icons/lu";
import {invoke} from "@tauri-apps/api/core";

interface FileDialogsProps {
  gameId: string;
  modVersion: string,
  files: ModFiles[];
  triggerContent: React.ReactNode;
}

const FilesDialog = ({gameId, modVersion, files, triggerContent}: FileDialogsProps) => {
  const {t} = useTranslation();
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
  const [isRemovingCache, setIsRemovingCache] = useState(false)
  const { isRefreshing, localMetadata, setLoadedMetadata} = useAppStore()
  
  const checkUpdates = async () => {
    setIsCheckingUpdates(true)
    const loadingToastId = toast.loading(i18n.t("Fetching updates from remote..."));
    setLoadedMetadata(await loadMetadata(true))
    toast.dismiss(loadingToastId)
    toast.success(i18n.t("Fetch complete."));
    setIsCheckingUpdates(false)
  }
  
  const refresh = async (showToast: boolean) => {
    const filePaths = files.map(item=> item.path);
    await refreshAllLocalMetadata(filePaths, showToast)
  }
  
  const removeMetadataCache = async () => {
    setIsRemovingCache(true)
    await invoke("clear_cached_metadata_command");
    setIsRemovingCache(false)
  }
  
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
              onClick={async () => {
                await checkUpdates()
              }}/>
            <div className="flex items-center space-x-1 rounded-md">
              <IconButton
                isLoading={isRefreshing}
                buttonDescription={t("Refresh")}
                tooltipContent={t("Re-check local file status")}
                buttonVariant={"outline"}
                buttonIcon={<UpdateIcon/>}
                onClick={async () => {
                  await refresh(true)
                }}/>
              <Separator orientation="vertical" className="h-[20px]" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="px-2">
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  alignOffset={-5}
                  className="max-w-sm"
                  forceMount
                >
                  <IconButton
                    isLoading={isRemovingCache}
                    isDisabled={isRefreshing}
                    buttonClassName="w-full"
                    tooltipContent={t("Force launcher to redo all checksum calculations on refresh.")}
                    buttonVariant={"ghost"}
                    buttonDescription={t("Clear Refresh Cache")}
                    buttonIcon={<LuRefreshCcwDot/>}
                    onClick={ async () => {
                      await removeMetadataCache()
                      await refresh(true)
                    }}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                  localFileMetadata={localMetadata.find(actual => actual.path === item.path)}
                  file={item}/>
                }) : <></>
              }
            </TableBody>
          </Table>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button className={"w-full"}>{t("Close")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FilesDialog;