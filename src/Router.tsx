import {createBrowserRouter} from "react-router-dom";
import Initialize from "@/components/initialize.tsx";
import Games from "@/components/games.tsx";
import {GAME_ROUTE, INITIALIZE_ROUTE} from "@/lib/constants.ts";

export function Router(){
  return createBrowserRouter([
    {
      path: "/",
      element: <Games/>,
    },
    {
      path: INITIALIZE_ROUTE,
      element: <Initialize/>,
    },
    {
      path: GAME_ROUTE,
      element: <Games/>,
    },
  ]);
}