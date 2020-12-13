import { PluginClient } from "@remixproject/plugin"
import { createClient } from "@remixproject/plugin-iframe"

export class RemixClient extends PluginClient {
  constructor() {
    super()
    createClient(this)
  }
}
