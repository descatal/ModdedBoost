import React from "react";

type TitleBarIconProps = {
  buttonIcon: React.ReactNode
  onClick: React.MouseEventHandler
}

const TitleBarButtons = ({buttonIcon, onClick}: TitleBarIconProps) => {
  return (
    <div className="inline-flex justify-center items-center min-w-[45px] min-h-[30px] hover:bg-accent"
         onClick={onClick}>
      {buttonIcon}
    </div>
  );
};

export default TitleBarButtons;