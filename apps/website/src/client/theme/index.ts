"use client";

import { useNavigation, useRouteLoaderData } from "react-router";

import { Theme } from "./enum";
import { isValidTheme } from "./util";
import type { Route } from "../+types/root";

export const useTheme = (): Theme => {
  let theme = useNavigation().formData?.get("theme");
  theme ||=
    useRouteLoaderData<Route.ComponentProps["loaderData"]>("root")?.theme;

  return isValidTheme(theme) ? theme : Theme.DARK;
};
