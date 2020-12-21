import { OpCode, StructLog } from "ethereum-types"

interface LineOffset {
    [key: number]: {
        from: number
        to: number
    }
}

export const getLineOffsets = (src: string) => {
    const lines = src.split("\n")
    const lineOffsets: LineOffset = {}
    let initialLine = 0

    lines.forEach((line, index) => {
        const lineSize = new Blob([line]).size
        lineOffsets[index + 1] = {
            from: initialLine,
            to: lineSize + initialLine,
        }
        initialLine += lineSize + 1
    })

    return lineOffsets
}

export const findLineFromOffsets = (lineOffsets: LineOffset, s: number) => {
    const lineItem = Object.keys(lineOffsets).filter((value) => {
        const currentItem = lineOffsets[value as any]
        return s >= currentItem.from && s <= currentItem.to
    })

    return parseInt(lineItem[0], 10)
}

interface IMapping {
    [key: string]: number
}

const isPush = (instruction: any) => instruction >= 0x60 && instruction < 0x7f // TODO: Improve types

const pushDataLength = (instruction: any) => instruction - 0x5f

const instructionLength = (instruction: any) =>
    isPush(instruction) ? 1 + pushDataLength(instruction) : 1

const byteToInstIndex = (binary: string) => {
    const result = []
    let byteIndex = 0
    let instIndex = 0
    while (byteIndex < binary.length) {
        const length = instructionLength(binary[byteIndex])
        for (let i = 0; i < length; i += 1) {
            result.push(instIndex)
        }
        byteIndex += length
        instIndex += 1
    }
    return result
}

export const parseRuntimeBinary = (binary: string) => {
    return byteToInstIndex(binary)
}

export const buildPcToInstructionMapping = (codeHexStrParam: string) => {
    const mapping: IMapping = {}
    const codeHexStr = codeHexStrParam.startsWith("0x") ? codeHexStrParam.slice(2) : codeHexStrParam
    let instructionIndex = 0

    for (let pc = 0; pc < codeHexStr.length / 2; ) {
        mapping[pc] = instructionIndex

        const byteHex = codeHexStr[pc * 2] + codeHexStr[pc * 2 + 1]
        const byte = parseInt(byteHex, 16)

        // PUSH instruction has immediates
        if (byte >= 0x60 && byte <= 0x7f) {
            const n = byte - 0x60 + 1 // number of immediates
            pc += n + 1
        } else {
            pc += 1
        }
        instructionIndex += 1
    }
    return mapping
}

// TODO: test
export const normalizeStructLogs = (structLogs: StructLog[]): StructLog[] => {
    if (structLogs[0].depth === 1) {
        // Geth uses 1-indexed depth counter whilst ganache starts from 0
        const newStructLogs = structLogs.map((structLog) => ({
            ...structLog,
            depth: structLog.depth - 1,
        }))
        return newStructLogs
    }
    return structLogs
}

// TODO: test
export const isCallLike = (op: OpCode): boolean => {
    return [OpCode.CallCode, OpCode.StaticCall, OpCode.Call, OpCode.DelegateCall].includes(op)
    // return _.includes(
    //   ,
    //   op
    // );
}

// export const getAddressFromStackEntry = (stackEntry: string): string => {
//   const hexBase = 16;
//   return padZeros(
//     new BigNumber(addHexPrefix(stackEntry)).toString(hexBase)
//   );
// }

export const isEndOpcode = (op: OpCode): boolean => {
    return [
        OpCode.Return,
        OpCode.Stop,
        OpCode.Revert,
        OpCode.Invalid,
        OpCode.SelfDestruct,
    ].includes(op)
}

// const parsed = srcmap
//   .split(";")
//   .map(l => l.split(":"))
//   .map(([s, l, f, j]) => ({ s: s === "" ? undefined : s, l, f, j }))
//   .reduce(
//     ([last, ...list], { s, l, f, j }) => [
//       {
//         s: parseInt(s || last.s, 10),
//         l: parseInt(l || last.l, 10),
//         f: parseInt(f || last.f, 10),
//         j: j || last.j
//       },
//       last,
//       ...list
//     ],
//     [{}]
//   )
//   .reverse()
//   .slice(1)
//   .map(
//     ({ s, l, f, j }) => `${srcmaps.sourceList[f]}:${getLineFromPos(source, s)}`
//   );

// https://solidity.readthedocs.io/en/develop/miscellaneous.html#source-mappings
export const parseSourceMap = (sourceMap: string) => {
    let prevS: string
    let prevL: string
    let prevF: string
    let prevJ: string

    return sourceMap
        .trim()
        .split(";")
        .map((section) => {
            let [s, l, f, j] = section.split(":")

            if (s === "" || s === undefined) {
                s = prevS
            } else {
                prevS = s
            }

            if (l === "" || l === undefined) {
                l = prevL
            } else {
                prevL = l
            }

            if (f === "" || f === undefined) {
                f = prevF
            } else {
                prevF = f
            }

            if (j === "" || j === undefined) {
                j = prevJ
            } else {
                prevJ = j
            }

            return { s: Number(s), l: Number(l), f: Number(f), j }
            // s: start, length, file, jump
        })
}
