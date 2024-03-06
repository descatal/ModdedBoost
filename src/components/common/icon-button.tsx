import React from 'react';
import {Button} from "@/components/ui/button.tsx";
import TooltipComponent from "@/components/common/tooltip-component.tsx";
import {Loader2} from "lucide-react";

type IconButtonProps = {
  buttonDescription: string,
  buttonIcon: React.ReactNode,
  onClick: React.MouseEventHandler
  iconPosition? : "left" | "right",
  tooltipContent?: string,
  buttonClassName?: string,
  buttonVariant?: "outline" | "link" | "default" | "destructive" | "secondary" | "ghost" | null | undefined,
  buttonSize?: "default" | "sm" | "lg" | "icon" | null | undefined
  breakpoint?: "sm" | "md" | "lg" | "xl" | "2xl" | "none"
  isLoading?: boolean,
  isDisabled?: boolean,
}

const IconButton = ({
                      buttonDescription,
                      buttonIcon,
                      onClick,
                      iconPosition = "left",
                      tooltipContent = "",
                      buttonVariant = "outline",
                      buttonClassName = "",
                      buttonSize = "sm",
                      breakpoint = "none",
                      isLoading = false,
                      isDisabled = false,
                    }: IconButtonProps) => {

  const icon =
    <div className={`${breakpoint != "none" ? `${breakpoint}:${iconPosition == "left" ? "mr-2" : "ml-2"} w-4` : ''}`}>
      {isLoading ? <Loader2 className={"mr-2 w-4 animate-spin"}/> : buttonIcon}
    </div>
  
  const description =
    buttonDescription ? <div
        className={`${iconPosition == "left" ? "ml-1" : "mr-2"} ${breakpoint != "none" ? `hidden ${breakpoint}:block` : ''}`}>{buttonDescription}</div> : ""

  return (
    <div>
      <TooltipComponent
        tooltipContent={tooltipContent}
        triggerContent={
          <div>
            <Button
              disabled={isLoading || isDisabled}
              type={"button"}
              variant={buttonVariant}
              className={buttonClassName}
              size={buttonSize}
              onClick={onClick}>
              {iconPosition == "left" 
                ? <>{icon} {description}</>
                : <>{description} {icon}</>
              }
            </Button>
          </div>
        }>
      </TooltipComponent>
    </div>
  );
};

export default IconButton;