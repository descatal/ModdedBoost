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
import {useConfigStore} from "@/lib/store/config.ts";

function SelectRemoteModal() {
  const {t} = useTranslation();
  const {openSelectRemoteModal, setOpenSelectRemoteModal} = useAppStore()
  const {setRemoteGroup} = useConfigStore.getState()

  const setRemote = async (remoteGroup: string) => {
    await setRemoteGroup(remoteGroup)
  }

  return (
    <AlertDialog open={openSelectRemoteModal} onOpenChange={setOpenSelectRemoteModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Select update source")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setRemote("china")}>{t("China")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default SelectRemoteModal;