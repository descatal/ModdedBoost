import {LanguagesIcon} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {useTranslation} from "react-i18next";

export function LanguageToggle() {
    const { i18n } = useTranslation()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <LanguagesIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => i18n.changeLanguage("en")}>
                    English (EN)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage("zh")}>
                    中文 (CN)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage("jp")}>
                    日本語 (JP)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
