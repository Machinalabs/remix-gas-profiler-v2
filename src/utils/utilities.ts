import { PluginApi, IRemixApi, PluginClient, Api } from "@remixproject/plugin"

type RemixClient = PluginApi<Readonly<IRemixApi>> &
  PluginClient<Api, Readonly<IRemixApi>>

export const getNetworkName = async (client: RemixClient) => {
  const network = await client.call("network", "detectNetwork")
  if (!network) {
    throw new Error("no known network to verify against")
  }
  const name = network.name!.toLowerCase()
  // TODO : remove that when https://github.com/ethereum/remix-ide/issues/2017 is fixed
  return name === "görli" ? "goerli" : name
}
