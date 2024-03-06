import {LanguagesIcon} from "lucide-react"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu.tsx"
import {useTranslation} from "react-i18next";
import {useConfigStore} from "@/lib/store/config.ts";
import {shallow} from "zustand/shallow";
import IconButton from "@/components/common/icon-button.tsx";

export function LanguageToggle() {
    const { i18n, t } = useTranslation()
    const { language, setLanguage } = useConfigStore(
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
              <div>
                <IconButton
                  buttonVariant={"ghost"}
                  buttonDescription={t("Language")}
                  tooltipContent={t("Select language")}
                  buttonIcon={<LanguagesIcon className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all"/>}
                  onClick={async () => {}}
                  breakpoint={"md"}
                />
              </div>
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
