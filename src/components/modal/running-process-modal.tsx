import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useTranslation} from "react-i18next";
import {useAppStore} from "@/lib/store/app.ts";

function RunningProcessModal() {
  const {t} = useTranslation();
  const {openRunningProcessModal, setOpenRunningProcessModal} = useAppStore()

  const retry = async () => {
    window.location.reload()
  }
  
  return (
    <AlertDialog open={openRunningProcessModal} onOpenChange={setOpenRunningProcessModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Duplicate instances")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("Hey, another instance of rpcs3 is currently running! 🚀")}
          </AlertDialogDescription>
          <AlertDialogDescription>
            {t("Please terminate the process and retry!")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={retry}>{t("Retry")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default RunningProcessModal;