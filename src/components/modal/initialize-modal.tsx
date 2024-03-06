import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useTranslation} from "react-i18next";
import {useAppStore} from "@/lib/store/app.ts";
import {useConfigStore} from "@/lib/store/config.ts";
import {toast} from "sonner";
import i18n from "i18next";
import {invoke} from "@tauri-apps/api/core";

function InitializeModal() {
  const {t} = useTranslation();
  const {openInitializeModal, setOpenInitializeModal, setIsInitializing} = useAppStore()
  const {rpcs3Path} = useConfigStore()
  
  const initializeCache = async () => {
    setIsInitializing(true)
    toast.info(i18n.t("Starting initialization process..."));

    await invoke("initialize", {
      rpcs3Executable: rpcs3Path
    })

    toast.success(i18n.t("Initialization process complete!"));
    setIsInitializing(false)
  }

  return (
    <AlertDialog open={openInitializeModal} onOpenChange={setOpenInitializeModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Initialize cache folder?")}</AlertDialogTitle>
          <AlertDialogDescription>
            <li>
              {t("The initialization process involves extracting existing patch files to the update cache repository. ")}
            </li>
            <li>
              {t("This step is required for new rpcs3 directories.")}
            </li>
            <li>
              {t("It will take around 5 - 10 minutes depending on the speed of your device.")}
            </li>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setOpenInitializeModal(false)
          }}>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={ async () => {
            await initializeCache()
          }}>{t("Initialize")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default InitializeModal;