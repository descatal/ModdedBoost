import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu.tsx"
import {useTranslation} from "react-i18next";
import IconButton from "@/components/common/icon-button.tsx";
import {GlobeIcon} from "@radix-ui/react-icons";
import {useConfigStore} from "@/lib/store/config.ts";
import {shallow} from "zustand/shallow";
import {useEffect, useState} from "react";
import {loadMirrors, Mirrors} from "@/lib/mirrors.ts";
import {VscCheck} from "react-icons/vsc";
import {invoke} from "@tauri-apps/api/core";

type MirrorGroupToggleProps = {
  buttonVariant?: "outline" | "link" | "default" | "destructive" | "secondary" | "ghost" | null | undefined,
  breakpoint?: "sm" | "md" | "lg" | "xl" | "2xl" | "none"
}

export function MirrorGroupSelector({buttonVariant = "ghost", breakpoint = "sm"}: MirrorGroupToggleProps) {
  const {t} = useTranslation();
  const [mirrors, setMirrors] = useState<Mirrors>()
  
  const {selectedMirrorGroup, setSelectedMirrorGroup} = useConfigStore(
    (state) => ({
      selectedMirrorGroup: state.mirrorGroup,
      setSelectedMirrorGroup: state.setMirrorGroup,
    }),
    shallow
  );

  useEffect(() => {
    const getMirrors = async () => {
      const loadedMirrors = await loadMirrors(true)
      setMirrors(loadedMirrors)
    };
    getMirrors().catch(console.error)
  }, [])

  useEffect(() => {
    
    const autoSelectMirror = async () => {
      // Ignore if mirrors aren't loaded or there's already a selected Mirror Group
      if (!mirrors || selectedMirrorGroup.remotes.length) return;
      
      for (let mirrorGroup of mirrors.mirrorGroups) {
        const isSuccessful = await invoke("get_is_success", {
          remote: mirrorGroup.testUrl
        })
        if (isSuccessful) {
          await setSelectedMirrorGroup(mirrorGroup)
          break;
        }
      }
    }
    
    autoSelectMirror().catch(err => console.error(err))
  }, [mirrors])
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <IconButton
            buttonVariant={buttonVariant}
            buttonDescription={t("Source")}
            tooltipContent={t("Select source")}
            buttonIcon={<GlobeIcon/>}
            onClick={() => {}}
            breakpoint={breakpoint}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {
          mirrors && mirrors.mirrorGroups.map(mirrorGroup => 
            <DropdownMenuItem key={mirrorGroup.name} className={"flex justify-between"} onClick={() => setSelectedMirrorGroup(mirrorGroup)}>
              {mirrorGroup.name}
              {selectedMirrorGroup?.name === mirrorGroup.name && <VscCheck/>}
            </DropdownMenuItem>
          )
        }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
