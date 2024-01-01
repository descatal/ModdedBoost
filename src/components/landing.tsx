import {Button} from "@/components/ui/button.tsx";
import {FileIcon} from "@radix-ui/react-icons";
import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import Config from "@/components/config.tsx";
import {ModeToggle} from "@/components/common/mode-toggle.tsx";
import {LanguageToggle} from "@/components/common/language-toggle.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {useTranslation} from "react-i18next";

export default function Landing() {
    const { t } = useTranslation();
    
    return (
        <main key="1" className="min-h-screen py-12 px-4 md:py-24 md:px-6 lg:py-32">
            <Card className="mx-auto w-full max-w-[500px] p-6 rounded-lg shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Modded Boost
                        </h1>
                        <div className="flex items-center justify-between space-x-2">
                            <LanguageToggle/>
                            <ModeToggle/>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label className="block text-sm font-medium"
                                   htmlFor="path">
                                {t('RPCS3 Directory')}
                            </Label>
                            <div className="flex justify-between items-center space-x-2 mt-2">
                                <Input
                                    className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    id="path"
                                    name="path"
                                    placeholder="/path/to/rpcs3"
                                    type="text"
                                />
                                <Button variant="outline">
                                    <FileIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <Tabs defaultValue="bljs" className="w-[400px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="bljs">BLJS10250</TabsTrigger>
                                <TabsTrigger value="npjb">NPJB00512</TabsTrigger>
                            </TabsList>
                            <TabsContent value="bljs">
                                <Config title={"BLJS10250"}/>
                            </TabsContent>
                            <TabsContent value="npjb">
                                <Config title={"NPJB00512"}/>
                            </TabsContent>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}

