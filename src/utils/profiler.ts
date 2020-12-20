import {
    buildPcToInstructionMapping,
    findLineFromOffsets,
    getLineOffsets,
    normalizeStructLogs,
    parseSourceMap,
} from "./others"

interface GasLine {
    [key: number]: {
        cost: number
        fileIndex: number
    }
}

export interface GasCostPerLine {
    line: number
    gasCost: number
    fileIndex: number
    fileName: string
}

export const getGasPerLineCost = (
    allFiles: string[],
    // fileIndex: number,
    sourceMap: string,
    bytecode: string,
    sourceCode: string,
    trace: any
): Promise<GasCostPerLine[]> => {
    return new Promise((resolve, reject) => {
        try {
            const sourceMapParsed = parseSourceMap(sourceMap)
            const pcToInstruction = buildPcToInstructionMapping(bytecode)
            const lineOffsets = getLineOffsets(sourceCode) // To know the lenght per line
            const lineGas: GasLine = {}
            const structLogs = trace.result ? trace.result.structLogs : trace.structLogs
            const normalisedStructLogs = normalizeStructLogs(structLogs)
            const bottomDepth = normalisedStructLogs[0].depth // should be 1
            for (let i = 0; i < normalisedStructLogs.length; ) {
                const { gas, gasCost: gasCostToBeParsed, op, pc } = normalisedStructLogs[i]

                const gasCost = parseInt(`${gasCostToBeParsed}`, 10)

                let cost: number

                if (["CALL", "CALLCODE", "DELEGATECALL", "STATICCALL"].includes(op)) {
                    // for call instruction, gasCost is 63/64*gas, not real gas cost
                    const gasBeforeCall = gas
                    do {
                        i += 1
                    } while (normalisedStructLogs[i].depth > bottomDepth)
                    cost = gasBeforeCall - normalisedStructLogs[i].gas
                } else if (["SSTORE"].includes(op)) {
                    i += 1
                    cost = 20000 // Note: Due to trace not giving SSTORE properly. TODO: Improve calculation but for the moment is ok..
                } else {
                    i += 1
                    cost = gasCost
                }

                const instructionIdx = pcToInstruction[pc]
                if (sourceMapParsed[instructionIdx]) {
                    const { s, l, f, j } = sourceMapParsed[instructionIdx] // eslint-disable-line
                    // Note: start, length, file, jump

                    const currentFileIndex = parseInt(`${f}, 10`)

                    if (f === -1) {
                        continue
                    }

                    const line = findLineFromOffsets(lineOffsets, s)

                    if (lineGas[line] === undefined) {
                        lineGas[line] = {
                            cost,
                            fileIndex: currentFileIndex,
                        }
                    } else {
                        lineGas[line] = {
                            cost: lineGas[line].cost + cost,
                            fileIndex: currentFileIndex,
                        }
                    }
                }
            }

            let gasPerLineCost: GasCostPerLine[] = []
            sourceCode.split("\n").forEach((line, lineRow) => {
                if (lineGas[lineRow] && lineGas[lineRow].cost > 0) {
                    const gas = lineGas[lineRow].cost || 0
                    gasPerLineCost.push({
                        line: lineRow,
                        gasCost: gas,
                        fileIndex: lineGas[lineRow].fileIndex,
                        fileName: allFiles[lineGas[lineRow].fileIndex],
                    })
                }
            })

            resolve(gasPerLineCost)
        } catch (error) {
            console.log("ERROR", error)
            reject(error)
        }
    })
}
