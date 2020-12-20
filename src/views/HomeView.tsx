import React, { useEffect, useState } from "react"
import {
    CompilationResult,
    RemixTxEvent,
    HighlightPosition,
    CompilationFileSources,
} from "@remixproject/plugin-api"

import { useRemix } from "../hooks"
import { GasCostPerLine, getGasPerLineCost, log } from "../utils"
import { WelcomeView } from "./WelcomeView"
import { DebuggerPluginRequiredError } from "../errors"

interface ContractInfo {
    bytecode: string
    deployedBytecode: string
    sourceMap: string
    deployedSourceMap: string
    sourceCode: string
    creationGasProfiling: GasCostPerLine[]
}

export const HomeView: React.FC = () => {
    const { clientInstance } = useRemix()

    const [latestTransaction, setLatestTransaction] = useState<RemixTxEvent | undefined>(undefined)
    const [hasntBeenUsed, setHasntBeenUsed] = useState(true)
    const [error, setError] = useState<undefined | DebuggerPluginRequiredError>()
    const [contractInfoMap, setContractInfoMap] = useState(new Map<string, ContractInfo>()) // to store records of contracts deployed
    const [contractGasCostMap, setContractGasCostMap] = useState(
        new Map<string, GasCostPerLine[]>()
    ) // to render latest gas costs

    const [currentFileSelected, setCurrentFileSelected] = useState("")

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

            const setStatusToError = () => {
                clientInstance.emit("statusChanged", {
                    key: "failed",
                    type: "error",
                    title: `Debugger plugin is not enabled`,
                })
            }

            const updateContractAddressesMap = (k: string, v: ContractInfo) => {
                console.log("address being stored", k)
                setContractInfoMap(new Map(contractInfoMap.set(k, v)))
            }

            const updateContractGasCostMap = (k: string, v: GasCostPerLine[]) => {
                setContractGasCostMap(new Map(contractGasCostMap.set(k, v)))
            }

            const resetContractGasCostMap = () => {
                setContractGasCostMap(new Map())
            }

            // Note:  Workaround for the annotations issue on auto compile, due to autocompile cleaning annotations. I force an update and re render...
            clientInstance.on(
                "solidity",
                "compilationFinished",
                (
                    filename: string,
                    source: CompilationFileSources,
                    language: string,
                    data: CompilationResult
                ) => {
                    console.log("New file selected", filename)
                    setCurrentFileSelected(undefined as any)
                    setCurrentFileSelected(filename)
                }
            )

            clientInstance.on("fileManager", "currentFileChanged", (file) => {
                console.log("New file selected", file)
                setCurrentFileSelected(file)
            })

            clientInstance.on("udapp", "newTransaction", async (transaction: RemixTxEvent) => {
                setError(undefined)
                log("A new transaction was sent", transaction)
                resetContractGasCostMap()
                setCurrentFileSelected(undefined as any)
                setHasntBeenUsed(false)
                setLatestTransaction(transaction)
                const { hash } = transaction
                log("Transaction hash", hash)

                const isContractCreation = (transaction as any).contractAddress ? true : false

                setStatusToLoading(hash)

                const traces = await clientInstance
                    .call("debugger" as any, "getTrace", hash)
                    .catch((error) => {
                        setError(new DebuggerPluginRequiredError("Debugger plugin is required"))
                    })

                try {
                    const compilationResult: CompilationResult = await clientInstance.solidity.getCompilationResult()
                    const contracts = (compilationResult as any).data.contracts
                    const allFiles = Object.keys(contracts)

                    for (const file of Object.keys(contracts)) {
                        for (const contract of Object.keys(contracts[file])) {
                            const currentContractEVMData = contracts[file][contract].evm
                            log("currentContractEVMData", currentContractEVMData)
                            if (isContractCreation) {
                                if (
                                    `0x${currentContractEVMData.bytecode.object}` ===
                                    transaction.input
                                ) {
                                    const originalSourceCode = (compilationResult as any).source.sources[
                                        file
                                    ].content.trim()

                                    const currentContractEVMData = contracts[file][contract].evm

                                    const sourceMap = currentContractEVMData.bytecode.sourceMap

                                    const bytecode = transaction.input

                                    const creationGasProfiling: GasCostPerLine[] = await getGasPerLineCost(
                                        allFiles,
                                        sourceMap,
                                        bytecode,
                                        originalSourceCode,
                                        traces
                                    )

                                    log("gasPerLineCost on creation", creationGasProfiling)

                                    updateContractAddressesMap(
                                        (transaction as any).contractAddress,
                                        {
                                            bytecode: currentContractEVMData.bytecode.object,
                                            sourceMap: currentContractEVMData.bytecode.sourceMap,
                                            deployedBytecode:
                                                currentContractEVMData.deployedBytecode.object,
                                            deployedSourceMap:
                                                currentContractEVMData.deployedBytecode.sourceMap,
                                            sourceCode: originalSourceCode,
                                            creationGasProfiling,
                                        }
                                    )

                                    allFiles.forEach((itemFile) => {
                                        const itemsFromItemFile = creationGasProfiling.filter(
                                            (s) => s.fileName === itemFile
                                        )
                                        updateContractGasCostMap(itemFile, itemsFromItemFile)
                                    })

                                    setStatusToSuccess(hash)
                                    setCurrentFileSelected(file)
                                }
                            } else {
                                const toAddress = (transaction as any).to
                                const contractUsed = contractInfoMap.get(toAddress)

                                if (contractUsed) {
                                    const creationGasProfiling: GasCostPerLine[] = await getGasPerLineCost(
                                        allFiles,
                                        contractUsed.deployedSourceMap,
                                        contractUsed.deployedBytecode,
                                        contractUsed.sourceCode,
                                        traces
                                    )

                                    log("gasPerLineCost on transaction", creationGasProfiling)

                                    allFiles.forEach((itemFile) => {
                                        const itemsFromItemFile = creationGasProfiling.filter(
                                            (s) => s.fileName === itemFile
                                        )
                                        updateContractGasCostMap(itemFile, itemsFromItemFile)
                                    })

                                    setStatusToSuccess(hash)
                                    setCurrentFileSelected(file)
                                }
                            }
                        }
                    }
                } catch (error) {
                    log("Error in newTransaction event handler", error.message)
                    setStatusToError()
                    setError(error)
                }
            })
        }
    }, [clientInstance])

    useEffect(() => {
        const addAnnotationsIfApply = async () => {
            let infoAboutMostExpensiveLine: GasCostPerLine = (undefined as unknown) as GasCostPerLine

            await (clientInstance as any).call("editor", "discardHighlight", currentFileSelected)
            await clientInstance.call("editor", "clearAnnotations" as any)

            const addAnnotations = async (gasPerLineCostResult: GasCostPerLine[]) => {
                return new Promise((resolve, reject) => {
                    try {
                        gasPerLineCostResult.forEach(async (lineCost: GasCostPerLine) => {
                            if (lineCost.gasCost > 0) {
                                if (!infoAboutMostExpensiveLine) {
                                    infoAboutMostExpensiveLine = lineCost
                                }

                                if (lineCost.gasCost > infoAboutMostExpensiveLine.gasCost) {
                                    infoAboutMostExpensiveLine = lineCost
                                }

                                await clientInstance.call("editor", "addAnnotation" as any, {
                                    row: lineCost.line - 1,
                                    column: 0,
                                    text: `Gas cost: ${lineCost.gasCost} Wei`,
                                    type: "warning",
                                })
                            }
                        })
                        resolve(true)
                    } catch (error) {
                        reject(error)
                    }
                })
            }

            const currentGasCostsToRender = contractGasCostMap.get(currentFileSelected)
            if (currentGasCostsToRender) {
                await addAnnotations(currentGasCostsToRender)
            }

            // highlight most expensive line
            if (infoAboutMostExpensiveLine) {
                const position: HighlightPosition = {
                    start: {
                        line: infoAboutMostExpensiveLine.line - 1,
                        column: 0,
                    },
                    end: {
                        line: infoAboutMostExpensiveLine.line - 1,
                        column: 100,
                    },
                }
                await (clientInstance as any).call(
                    "editor",
                    "highlight",
                    position,
                    currentFileSelected
                )
            }
        }

        console.log("currentFileSelected", currentFileSelected)

        if (clientInstance && currentFileSelected) {
            addAnnotationsIfApply()
        }
    }, [currentFileSelected, clientInstance])

    if (hasntBeenUsed) {
        return <WelcomeView />
    }

    if (error instanceof DebuggerPluginRequiredError) {
        return (
            <div className="alert alert-danger" role="alert">
                WARNING: Debugger plugin is required
            </div>
        )
    }

    return (
        <div>
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
        <li className="custom list-group-item d-print-flex" style={{ overflowX: "hidden" }}>
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
