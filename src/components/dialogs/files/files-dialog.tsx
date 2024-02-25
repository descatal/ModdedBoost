import {Button} from '../../ui/button.tsx';
import React from "react";
import {Table, TableBody, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {useTranslation} from "react-i18next";
import FilesTableRow from "@/components/dialogs/files/files-table-row.tsx";
import {GlobeIcon, UpdateIcon} from "@radix-ui/react-icons";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer.tsx";
import IconButton from "@/components/common/icon-button.tsx";
import {ModFiles} from "@/lib/metadata.ts";

interface FileDialogsProps {
  gameId: string;
  files: ModFiles[];
  triggerContent: React.ReactNode;
}

const FilesDialog = ({gameId, files, triggerContent}: FileDialogsProps) => {
  const {t} = useTranslation();
  
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
          <div className="flex gap-1 justify-end">
            <IconButton
              buttonDescription={t("Select source")}
              tooltipContent={t("Select download source")}
              buttonIcon={<GlobeIcon/>}
              onClick={() => {
              }}/>
            <IconButton
              buttonDescription={t("Check for updates")}
              tooltipContent={t("Fetch data from remote")}
              buttonIcon={<UpdateIcon/>}
              onClick={() => {
              }}/>
          </div>
        </DrawerHeader>
        <div className={"h-[100%] relative overflow-auto"}>
          <Table className="border shadow-sm rounded-lg">
            <TableHeader className={"sticky -top-0.5 bg-secondary z-10"}>
              <TableRow>
                <TableHead className="text-center w-[150px]">File Name</TableHead>
                <TableHead className="text-center w-[200px]">Version</TableHead>
                <TableHead className="text-center hidden sm:flex justify-center items-center">Progress</TableHead>
                <TableHead className="text-center w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files ? files.map(item => {
                return <FilesTableRow
                  key={item.path}
                  file={item}/>
                }) : <></>
              }
            </TableBody>
          </Table>
        </div>
        <DrawerFooter>
          <Button type="submit">{t("Update all")}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FilesDialog;