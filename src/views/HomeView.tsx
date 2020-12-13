import React, { useEffect, useState } from "react"
import {
  CompilationResult,
  RemixTxEvent,
  HighlightPosition,
} from "@remixproject/plugin-api"

import { useRemix } from "../hooks"
import { getGasPerLineCost, log } from "../utils"
import { WelcomeView } from "./WelcomeView"

interface GasPerLineCost {
  lineNumber: number
  gasCost: any
}

export const HomeView: React.FC = () => {
  const { clientInstance } = useRemix()

  const [latestTransaction, setLatestTransaction] = useState<
    RemixTxEvent | undefined
  >(undefined)
  const [hasntBeenUsed, setHasntBeenUsed] = useState(true)

  useEffect(() => {
    if (clientInstance) {
      const setStatusToLoading = (transactionHash: string) => {
        clientInstance.emit("statusChanged", {
          key: "loading",
          type: "info",
          title: `Profiling for tx ${transactionHash} in progress`,
        })
      }

      const setStatusToSuccess = (transactionHash: string) => {
        clientInstance.emit("statusChanged", {
          key: "succeed",
          type: "success",
          title: `New profiling for tx ${transactionHash} is ready`,
        })
      }

      clientInstance.on(
        "udapp",
        "newTransaction",
        async (transaction: RemixTxEvent) => {
          try {
            log("A new transaction was sent", transaction)

            setHasntBeenUsed(false)
            setLatestTransaction(transaction)

            const { hash } = transaction
            log("Transaction hash", hash)

            const isContractCreation = (transaction as any).contractAddress
              ? true
              : false

            setStatusToLoading(hash)

            const traces = await clientInstance.call(
              "debugger" as any,
              "getTrace",
              hash
            )
            log("Traces ", traces)

            const compilationResult: CompilationResult = await clientInstance.solidity.getCompilationResult()
            log("Compilation Result", compilationResult)

            const contracts = (compilationResult as any).data.contracts

            for (const file of Object.keys(contracts)) {
              for (const contract of Object.keys(contracts[file])) {
                const originalSourceCode = (compilationResult as any).source.sources[
                  file
                ].content.trim()
                log("originalSourceCode", originalSourceCode)

                const currentContractEVMData = contracts[file][contract].evm
                log("currentContractEVMData", currentContractEVMData)

                const sourceMap = isContractCreation
                  ? currentContractEVMData.bytecode.sourceMap
                  : currentContractEVMData.deployedBytecode.sourceMap
                log("sourceMap", sourceMap)

                const bytecode = isContractCreation
                  ? currentContractEVMData.bytecode.object
                  : currentContractEVMData.deployedBytecode.object
                log("bytecode", bytecode)

                const gasPerLineCost = (await getGasPerLineCost(
                  sourceMap,
                  bytecode,
                  originalSourceCode,
                  traces
                )) as GasPerLineCost[] // Array of { lineNumber, gasCost }

                setStatusToSuccess(hash)

                let infoAboutMostExpensiveLine: GasPerLineCost = (undefined as unknown) as GasPerLineCost

                await clientInstance.call("editor", "clearAnnotations" as any)

                const addAnnotations = async (
                  gasPerLineCostResult: GasPerLineCost[]
                ) => {
                  return new Promise((resolve, reject) => {
                    try {
                      gasPerLineCostResult.forEach(
                        async (lineCost: GasPerLineCost) => {
                          if (lineCost.gasCost > 0) {
                            if (!infoAboutMostExpensiveLine) {
                              infoAboutMostExpensiveLine = lineCost
                            }

                            if (
                              lineCost.gasCost >
                              infoAboutMostExpensiveLine.gasCost
                            ) {
                              infoAboutMostExpensiveLine = lineCost
                            }

                            await clientInstance.call(
                              "editor",
                              "addAnnotation" as any,
                              {
                                row: lineCost.lineNumber,
                                column: 0,
                                text: `${lineCost.gasCost}`,
                                type: "info",
                              }
                            )
                          }
                        }
                      )
                      resolve()
                    } catch (error) {
                      reject(error)
                    }
                  })
                }

                await addAnnotations(gasPerLineCost)

                // highlight most expensive line
                if (infoAboutMostExpensiveLine) {
                  const position: HighlightPosition = {
                    start: {
                      line: infoAboutMostExpensiveLine.lineNumber,
                      column: 0,
                    },
                    end: {
                      line: infoAboutMostExpensiveLine.lineNumber,
                      column: 100,
                    },
                  }
                  await clientInstance.call(
                    "editor",
                    "highlight",
                    position,
                    file,
                    "0xfff"
                  )
                }
              }
            }
          } catch (error) {
            log("Error in newTransaction event handler", error.message)
            // setStatusToError()
            // showErrorView
          }
        }
      )
    }
  }, [clientInstance])

  return (
    <div>
      {hasntBeenUsed ? (
        <WelcomeView />
      ) : (
        <ul className="list-group">
          {latestTransaction && (
            <TransactionHeader
              hash={latestTransaction.hash}
              transactionCost={latestTransaction.transactionCost}
              executionCost={(latestTransaction as any).executionCost}
              contractAddress={(latestTransaction as any).contractAddress}
              to={(latestTransaction as any).to}
            />
          )}
        </ul>
      )}
    </div>
  )
}

interface TransactionHeaderProps {
  hash: string
  transactionCost: string
  executionCost: string
  contractAddress: string
  to: string
}

export const TransactionHeader: React.FC<TransactionHeaderProps> = ({
  hash,
  transactionCost,
  executionCost,
  contractAddress,
  to,
}) => {
  return (
    <li className="custom list-group-item d-print-flex">
      <h6>Transaction hash</h6>
      <p className="badge badge-light">{hash}</p>
      <h6> Contract address </h6>
      <p className="badge badge-light">{contractAddress || to}</p>
      <h6>Transaction cost</h6>
      <p className="badge badge-light">{transactionCost}</p>
      <h6>Execution cost</h6>
      <p className="badge badge-light">{executionCost}</p>
    </li>
  )
}
