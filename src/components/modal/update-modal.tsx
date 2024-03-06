import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useTranslation} from "react-i18next";
import {useAppStore} from "@/lib/store/app.ts";
import {useState} from "react";
import {relaunch} from "@tauri-apps/plugin-process";
import IconButton from "@/components/common/icon-button.tsx";
import {UpdateIcon} from "@radix-ui/react-icons";

function UpdateModal() {
  const {t} = useTranslation();
  const {openUpdateModal, updateInfo, setOpenUpdateModal} = useAppStore()
  const [isUpdating, setIsUpdating] = useState(false)

  return (
    <AlertDialog open={openUpdateModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Update available!")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("A new version of launcher is available.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setOpenUpdateModal(null)
          }}>{t("Cancel")}</AlertDialogCancel>
          <IconButton
            isLoading={isUpdating}
            buttonVariant={"default"}
            buttonDescription={t("Update")}
            buttonIcon={<UpdateIcon/>}
            onClick={async () => {
              setIsUpdating(true)
              if (updateInfo) {
                await updateInfo.downloadAndInstall();
                await relaunch();
              }
              setIsUpdating(false)
            }}>
          </IconButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default UpdateModal;