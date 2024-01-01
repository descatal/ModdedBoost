import {Card} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {RocketIcon, UpdateIcon} from "@radix-ui/react-icons";
import {Label} from "@/components/ui/label.tsx";
import {useTranslation} from "react-i18next";

function Config({ title }: { title: string }) {
    const { t } = useTranslation()
    
    return (
        <div>
            <Card className="mx-auto w-full max-w-[500px] p-6 rounded-lg shadow-lg">
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                            {t('Game Version')}
                        </Label>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold">1.05</span>
                            <Button className="text-xs" variant="outline" size="icon">
                                <UpdateIcon className="w-3 h-3"/>
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                            {t('Mod Version')}
                        </Label>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold">0.0.5</span>
                            <Button className="text-xs" variant="outline" size="icon">
                                <UpdateIcon className="w-3 h-3"/>
                            </Button>
                        </div>
                    </div>
                    <Button className="w-full">
                        {t('Launch')} {title}
                        <RocketIcon className="w-3 h-3 ml-2"/>
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export default Config;