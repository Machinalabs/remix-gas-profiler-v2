import React from "react"

import { Routes } from "./routes"
import { RemixProvider } from "./hooks"

import "./App.css"

const App = () => {
  return (
    <RemixProvider>
      <Routes />
    </RemixProvider>
  )
}

export default App
