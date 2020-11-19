import React from "react"
import { PluginApi, IRemixApi, Api, PluginClient } from "@remixproject/plugin"

import { ThemeType } from "./types"

export const AppContext = React.createContext({
  clientInstance: {} as PluginApi<Readonly<IRemixApi>> &
    PluginClient<Api, Readonly<IRemixApi>>,
  themeType: "dark" as ThemeType,
  setThemeType: (themeType: ThemeType) => {
    console.log("Calling Set Theme Type")
  },
})
