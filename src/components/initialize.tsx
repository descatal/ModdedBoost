import {ArrowRightIcon, MagicWandIcon} from "@radix-ui/react-icons";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Input} from "@/components/ui/input.tsx";
import {useTranslation} from "react-i18next";
import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";
import {useConfigStore} from "@/lib/store/config.ts";
import {debounce} from 'lodash';
import FileSelectIconButton from "@/components/common/file-select-icon-button.tsx";
import IconButton from "@/components/common/icon-button.tsx";
import {useAppStore} from "@/lib/store/app.ts";
import {FileResponse} from "@tauri-apps/plugin-dialog";
import {useNavigate} from "react-router-dom";
import {checkRpcs3Initialized, checkRpcs3Validity} from "@/lib/rpcs3.ts";

export default function Initialize() {
  const {t, i18n} = useTranslation();
  const {setOpenInitializeModal, isInitializing} = useAppStore();
  const {rpcs3Path, setRpcs3Path} = useConfigStore(
    (state) => ({
      rpcs3Path: state.rpcs3Path,
      setRpcs3Path: state.setRpcs3Path,
    })
  );
  const [isChecking, setIsChecking] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [valid, setIsValid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Debounce the input handler to delay processing
  const debouncedHandleChange = debounce(async () => {
    const currentPath = inputRef.current!.value;
    await setRpcs3Path(currentPath);
    await processDirectory(true, currentPath);
  }, 500);

  const changeRpcs3Path = async (selectedPath: FileResponse | null) => {
    // user selected multiple files or cancelled the selection
    if (Array.isArray(selectedPath) || selectedPath === null) return;

    inputRef.current!.value = selectedPath.path
    debouncedHandleChange.cancel() // cancel in case someone else is typing
    await setRpcs3Path(selectedPath.path)
    await processDirectory(true,  selectedPath.path);
  };

  // Handle manual inputs
  const handleRpcs3PathChange = (event: { target: { value: string; }; }) => {
    // Update the ref with the new value
    inputRef.current!.value = event.target.value;

    // Invoke the debounced function
    debouncedHandleChange();
  };

  const processDirectory = async (showToast: boolean, path: string) => {
    if (showToast) toast.info(i18n.t("Rpcs3 path changed, processing directory..."));

    setIsChecking(true)
    const isValidRpcs3: boolean = await checkRpcs3Validity(path)
    setIsValid(isValidRpcs3)
    
    if (isValidRpcs3) {
      if (showToast) toast.success(i18n.t("Valid executable found!"));
      
      const isInitialized: boolean = await checkRpcs3Initialized(path)
      setInitialized(isInitialized)
    } else {
      if (showToast) toast.error(i18n.t("The specified file path is not a valid rpcs3 executable!"));
    }
    setIsChecking(false)
  }

  useEffect(() => {
    // Invoke the debounced function for first time loading
    debouncedHandleChange()
  }, []);

  useEffect(() => {
    const reprocessDirectory = async () => {
      await processDirectory(false, rpcs3Path)
    }
    
    if (!isInitializing) {
      reprocessDirectory().catch(console.error)
    }
  }, [isInitializing]);

  return (
    <main className="min-h-screen flex h-screen">
      <div className="m-auto w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold mb-6">Modded Boost</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("Specify Game Executable")}</CardTitle>
            <CardDescription>{t("Please locate the game executable file to initialize the launcher.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex space-x-2">
                <Input
                  disabled={isChecking || isInitializing}
                  defaultValue={rpcs3Path}
                  ref={inputRef}
                  onChange={handleRpcs3PathChange}
                  className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="/path/to/rpcs3"
                  type="text"
                />
                <FileSelectIconButton
                  directory={false}
                  multiple={false}
                  defaultPath={rpcs3Path}
                  onFilesSelected={changeRpcs3Path}
                  buttonDescription={t("Browse")}
                  tooltipContent={t("Open file dialog")}
                  isLoading={isChecking}
                  isDisabled={isInitializing}
                />
              </div>
              {
                valid ?
                  initialized ?
                    <IconButton
                      iconPosition={"right"}
                      buttonSize={"lg"}
                      breakpoint={"none"}
                      tooltipContent={"Continue"}
                      buttonDescription={t("Continue")}
                      buttonIcon={<ArrowRightIcon/>}
                      onClick={() => {
                        navigate('/game', { replace: false });
                      }}
                      buttonVariant={"default"}
                      buttonClassName={"w-full"}
                      isLoading={isInitializing}
                      isDisabled={isChecking}
                    /> :
                    <IconButton
                      buttonSize={"lg"}
                      breakpoint={"none"}
                      tooltipContent={"Initialize"}
                      buttonDescription={t("Initialize game cache")}
                      buttonIcon={<MagicWandIcon/>}
                      onClick={() => {
                        setOpenInitializeModal(true)
                      }}
                      buttonVariant={"default"}
                      buttonClassName={"w-full"}
                      isLoading={isInitializing}
                      isDisabled={isChecking}
                    />
                  : <></>
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
