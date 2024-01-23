import {desktopDir} from "@tauri-apps/api/path";
import {FileIcon} from "@radix-ui/react-icons";
import {open} from "@tauri-apps/api/dialog";
import IconButton from "@/components/common/icon-button.tsx";

type OpenFileIconButtonProps = {
  directory: boolean,
  multiple: boolean,
  defaultPath: string,
  buttonDescription: string,
  tooltipContent: string,
  onFilesSelected: (paths: string | string[] | null) => void
}

const FileSelectIconButton = ({directory, multiple, defaultPath, buttonDescription, tooltipContent, onFilesSelected}: OpenFileIconButtonProps) => {
  const openDialog = async () => {
    const paths = await open({
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
      />
    </div>
  );
};

export default FileSelectIconButton