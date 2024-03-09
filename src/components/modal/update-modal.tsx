import {
  AlertDialog,
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
  const {openUpdateModal, updateInfo} = useAppStore()
  const [isUpdating, setIsUpdating] = useState(false)

  return (
    <AlertDialog open={openUpdateModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>✨ {t("New Update Available!")}</AlertDialogTitle>
          <AlertDialogDescription>
            🚀 {t("A new version of launcher is available!")} <br/> 
            {t("Please click on the Update button to begin the update process.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
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