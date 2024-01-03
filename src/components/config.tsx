import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  DoubleArrowUpIcon,
  RocketIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import { Label } from "@/components/ui/label.tsx";
import { useTranslation } from "react-i18next";
import HoverIconButton from "@/components/common/hover-icon-button.tsx";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

const launchGame = (rpcs3Path: String) => {
  invoke("auto_find_path_and_run_game", {
    fullPath: rpcs3Path + `\\rpcs3.exe`,
  });
};

function Config({ title, rpcs3Path }: { title: string; rpcs3Path: string }) {
  const { t } = useTranslation();
  const [isModVersionSpinning, setModVersionSpinning] = useState(false);

  const handleClick = () => {
    // Your click handling logic here
    console.log("Button clicked!");

    setModVersionSpinning(true);

    // Simulate a delay for the spinning effect
    setTimeout(() => {
      // Reset isSpinning after the delay
      setModVersionSpinning(false);
    }, 1000);
  };

  return (
    <div>
      <Card className="mx-auto w-full max-w-[500px] p-6 rounded-lg shadow-lg">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t("Game Version")}</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold">1.05</span>
              <HoverIconButton
                onClick={handleClick}
                tooltipContent={t("Apply updates")}
                icon={<DoubleArrowUpIcon className={`w-3 h-3}`} />}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t("Mod Version")}</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold">0.0.5</span>
              <HoverIconButton
                onClick={handleClick}
                tooltipContent={t("Check for updates")}
                icon={
                  <UpdateIcon
                    className={`w-3 h-3 ${
                      isModVersionSpinning ? "animate-spin" : ""
                    }`}
                  />
                }
              />
            </div>
          </div>
          <Button className="w-full" onClick={() => launchGame(rpcs3Path)}>
            {t("Launch")} {title}
            <RocketIcon className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Config;
