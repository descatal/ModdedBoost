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
import {Button} from "@/components/ui/button.tsx";

function UpdateModal() {
  const {t} = useTranslation();
  const {openUpdateModal, setOpenUpdateModal, updateInfo} = useAppStore()
  // const [isUpdating, setIsUpdating] = useState(false)
  
  return (
    <AlertDialog open={openUpdateModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>✨ {t("New Update Available!")}</AlertDialogTitle>
          <AlertDialogDescription>
            🚀 {t("A new version of launcher is available!")} <br/>
            {t("Please download and install the updater from the link below.")} <br/>
            {t("Current version")}: {updateInfo?.currentVersion} <br/>
            {t("New version")}: {updateInfo?.version}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className={"flex space-x-2"}>
            <Button
              variant={"outline"}
              onClick={() => {
                setOpenUpdateModal(null)
              }}>
              {t("Cancel")}
            </Button>
            <Button asChild>
              <a
                href="https://github.com/descatal/ModdedBoost/releases/latest" target="_blank">
                {t("Update")}
              </a>
            </Button>
          </div>

          {/*<IconButton*/}
          {/*  isLoading={isUpdating}*/}
          {/*  buttonVariant={"default"}*/}
          {/*  buttonDescription={t("Update")}*/}
          {/*  buttonIcon={<UpdateIcon/>}*/}
          {/*  onClick={async () => {*/}
          {/*    //setIsUpdating(true)*/}
          {/*    if (updateInfo) {*/}
          {/*      // await info("Updating application")*/}
          {/*      // await updateInfo.downloadAndInstall();*/}
          {/*      // await relaunch();*/}
          {/*    }*/}
          {/*    //setIsUpdating(false)*/}
          {/*  }}>*/}
          {/*</IconButton>*/}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
);
}

export default UpdateModal;