import {desktopDir} from "@tauri-apps/api/path";
import {FileIcon} from "@radix-ui/react-icons";
import {FileResponse, open} from "@tauri-apps/plugin-dialog";
import IconButton from "@/components/common/icon-button.tsx";

type OpenFileIconButtonProps = {
  directory: boolean,
  multiple: boolean,
  defaultPath: string,
  buttonDescription: string,
  tooltipContent: string,
  onFilesSelected: (paths: FileResponse | null) => void,
  isLoading?: boolean
  isDisabled?: boolean
}

const FileSelectIconButton = ({
                                directory,
                                multiple,
                                defaultPath,
                                buttonDescription,
                                tooltipContent,
                                onFilesSelected,
                                isLoading = false,
                                isDisabled = false,
                              }: OpenFileIconButtonProps) => {
  const openDialog = async () => {
    const paths: FileResponse | null = await open({
      directory: directory,
      multiple: multiple,
      defaultPath: defaultPath || await desktopDir(),
    });
    onFilesSelected(paths);
  };

  return (
    <div>
      <IconButton
        buttonDescription={buttonDescription}
        tooltipContent={tooltipContent}
        buttonIcon={<FileIcon/>}
        onClick={openDialog}
        breakpoint={"none"}
        isLoading={isLoading}
        isDisabled={isDisabled}
      />
    </div>
  );
};

export default FileSelectIconButton