import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import {useTranslation} from "react-i18next";
import IconButton from "@/components/common/icon-button.tsx";
import {MoonIcon, SunIcon} from "@radix-ui/react-icons";
import {useConfigStore} from "@/lib/store/config.ts";
import {shallow} from "zustand/shallow";

export function ModeToggle() {
  const {t} = useTranslation();

  const {setTheme} = useConfigStore(
    (state) => ({
      theme: state.theme,
      setTheme: state.setTheme,
    }),
    shallow
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <IconButton
            buttonVariant={"ghost"}
            buttonDescription={t("Theme")}
            tooltipContent={t("Select theme")}
            buttonIcon={
              <div className={"relative"}>
                <SunIcon
                  className="absolute rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
                <MoonIcon
                  className="rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
              </div>
            }
            onClick={async () => {
            }}
            breakpoint={"md"}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          {t("Light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          {t("Dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          {t("System")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
