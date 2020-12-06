import React, { useEffect } from "react"
import { useRemix } from "../hooks"

export const HomeView: React.FC = () => {
  const { clientInstance } = useRemix()

  useEffect(() => {
    if (clientInstance) {
      console.log("Client instance", clientInstance)
      // clientInstance.on('fileManager', 'currentFileChanged', (file: string) => {
      //   console.log("Current file changed", file)
      //   // setCurrentFileName(file)
      // })
      // TODO: Once remix team enable this
      // clientInstance.on('fileManager', 'noFileSelected', () => {
      //   setCurrentFileName('')
      // })
    }
  }, [clientInstance])
  
  return (
    <div>
      <h1>Home</h1>
    </div>
  )
}