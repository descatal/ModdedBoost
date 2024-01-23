import React from 'react';
import {Button} from "@/components/ui/button.tsx";
import TooltipComponent from "@/components/common/tooltip-component.tsx";

type IconButtonProps = {
  buttonDescription: string,
  tooltipContent: string,
  buttonIcon: React.ReactNode,
  onClick: React.MouseEventHandler
  breakpoint?: "sm" | "md" | "lg" | "xl" | "2xl"
}

const IconButton = ({buttonDescription, tooltipContent, buttonIcon, onClick, breakpoint = "sm"}: IconButtonProps) => {
  return (
    <div>
      <TooltipComponent
        tooltipContent={tooltipContent}
        triggerContent={
          <div>
            <Button variant="outline" size="sm" onClick={onClick}>
              <div className={`${buttonDescription ? `${breakpoint}:mr-2 h-4 w-4` : ""}`}>
                {buttonIcon}
              </div>
              {buttonDescription ? <p className={`hidden ${breakpoint}:block`}>{buttonDescription}</p> : ""}
            </Button>
          </div>
        }>
      </TooltipComponent>
    </div>
  );
};

export default IconButton;