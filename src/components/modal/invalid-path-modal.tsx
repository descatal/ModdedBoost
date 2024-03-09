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

function InvalidPathModal() {
  const {t} = useTranslation();
  const {openInvalidPathModal, setOpenInvalidPathModal} = useAppStore()
  
  return (
    <AlertDialog open={openInvalidPathModal} onOpenChange={setOpenInvalidPathModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Path not supported")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("Path containing Chinese / Japanese characters are not supported!")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setOpenInvalidPathModal(false)}>{t("Retry")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default InvalidPathModal;