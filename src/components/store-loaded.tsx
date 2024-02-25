import React from 'react';
import {useConfigStore} from "@/lib/store/config.ts";

export interface StoreLoadedProps {
  children: React.ReactNode;
}

const StoreLoaded = (props: StoreLoadedProps) => {
  const hydrated = useConfigStore((state) => state._hydrated);
  
  if (!hydrated)
    return null
  
  return <>{props.children}</>
};

export default StoreLoaded;