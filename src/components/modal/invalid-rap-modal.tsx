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

function InvalidRapModal() {
  const {t} = useTranslation();
  const {openInvalidRapFileModal, setOpenInvalidRapFileModal} = useAppStore()
  
  return (
    <AlertDialog open={openInvalidRapFileModal} onOpenChange={setOpenInvalidRapFileModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Invalid RAP file")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("A valid RAP file is required to launch the game.")} <br/>
            {t("Please place your RAP file in 'dev_hdd0/home/00000001/exdata'")} <br/>
            <a href="https://wiki.rpcs3.net/index.php?title=Help:Dumping_PlayStation_3_games" 
               className={"text-primary underline underline-offset-4"}
               target="_blank"
            >
              {t("More information")}
            </a>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setOpenInvalidRapFileModal(false)}>{t("Retry")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default InvalidRapModal;