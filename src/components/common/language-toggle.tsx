import {LanguagesIcon} from "lucide-react"

import {Button} from "@/components/ui/button"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import {useTranslation} from "react-i18next";
import {useStore} from "@/lib/store.ts";
import {shallow} from "zustand/shallow";

export function LanguageToggle() {
    const { i18n } = useTranslation()
    const { language, setLanguage } = useStore(
      (state) => ({
          language: state.language,
          setLanguage: state.setLanguage,
      }),
      shallow
    );
    
    const changeLanguage = async (selected: string) => {
        await setLanguage(selected);
        await i18n.changeLanguage(selected);
    }
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <LanguagesIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" defaultValue={language}>
                <DropdownMenuItem onClick={() => changeLanguage("en")}>
                    English (EN)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("zh")}>
                    中文 (CN)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("jp")}>
                    日本語 (JP)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
