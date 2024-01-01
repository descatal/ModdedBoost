import React from 'react';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Button} from "@/components/ui/button.tsx";

interface ButtonIconHoverProps {
    tooltipContent: React.ReactNode;
    icon: React.ReactNode;
    onClick?: () => void;
}

const HoverIconButton: React.FC<ButtonIconHoverProps> = ({ tooltipContent, icon, onClick }) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button className="text-xs"
                            variant="outline"
                            size="icon"
                            onClick={onClick}>
                        {icon}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipContent}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default HoverIconButton;