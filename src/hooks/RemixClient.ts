import { PluginClient } from "@remixproject/plugin"
import { createClient } from "@remixproject/plugin-webview"

export class RemixClient extends PluginClient {
    constructor() {
        super()
        createClient(this)
    }
}
