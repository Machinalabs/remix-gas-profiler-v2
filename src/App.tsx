import React, { useState, useEffect, useRef } from "react"

import { createIframeClient } from "@remixproject/plugin"

import { AppContext } from "./AppContext"
import { Routes } from "./routes"

import { ThemeType } from "./types"

import "./App.css"

const devMode = { port: 8080 }

const PLUGIN_NAME = 'Remix Gas Profiler '

const App = () => {
  const [clientInstance, setClientInstance] = useState(undefined as any)
  const [themeType, setThemeType] = useState("dark" as ThemeType)
  const clientInstanceRef = useRef(clientInstance)
  clientInstanceRef.current = clientInstance

  useEffect(() => {
    console.log(`${PLUGIN_NAME} loading...`)
    const client = createIframeClient({ devMode })
    const loadClient = async () => {
      await client.onload()
      setClientInstance(client)
      console.log(`${PLUGIN_NAME} Plugin has been loaded`)
      const currentTheme = await client.call("theme", "currentTheme")
      setThemeType(currentTheme.quality)
      client.on("theme", "themeChanged", (theme) => {
        setThemeType(theme.quality)
      })
    }

    loadClient()
  }, [])

  return (
    <AppContext.Provider
      value={{
        clientInstance,
        themeType,
        setThemeType,
      }}
    >
      <Routes />
    </AppContext.Provider>
  )
}

export default App
