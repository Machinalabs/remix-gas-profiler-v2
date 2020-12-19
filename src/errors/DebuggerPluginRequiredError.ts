export class DebuggerPluginRequiredError extends Error {
    constructor(message: string) {
        super(message)
        this.message = "Debugger plugin is required"
    }
}