import fs from "fs"
import path from "path"

import { getGasPerLineCost } from "./profiler"

const SOURCEMAP_FILE = "./mock-data/source-maps.json" // TODO Change this
const PROVIDER = "http://localhost:8545" // TODO
const CONTRACT_ADDRESS = "0x007a4908dd8c49b0231d21baad2c449b2cdb97ed" // TODO
const CONTRACT_FILE = "./mock-data/SimpleStorage.sol" // TODO Change this
const TRACE_SAMPLE_FILE = "./mock-data/sample-trace.json"

const TRACE_SAMPLE_GANACHE_FILE = "./mock-data/sample-ganache-trace.json"
const TRACE_SAMPLE_GETH_FILE = "./mock-data/sample-geth-trace.json"
const TRACE_SAMPLE_REMIX_FILE = "./mock-data/sample-remix-trace.json"
const TRACE_MULTIPLE_FILES_REMIX = "./mock-data/trace-multiple-files.json"

interface SourceMapFile {
    sourceMap: string
}

describe("Profiler tests", () => {
    const sampleFileName = "browser/ContractA.sol"
    let sourceMapFile: SourceMapFile
    let sourceMap: string
    let originalSourceCode: string

    beforeAll(() => {
        const sourceMapFileContent = fs.readFileSync(path.join(__dirname, SOURCEMAP_FILE), "utf8")
        sourceMapFile = JSON.parse(sourceMapFileContent)
        sourceMap = sourceMapFile.sourceMap
        originalSourceCode = fs.readFileSync(path.join(__dirname, CONTRACT_FILE), "utf8")
    })

    it.skip("generate the gas profiler report", async () => {
        const traceJSONSample = JSON.parse(
            fs.readFileSync(path.join(__dirname, TRACE_SAMPLE_FILE), "utf8")
        )

        const bytecode =
            "608060405234801561001057600080fd5b506103e860008190555060d3806100286000396000f3fe6080604052600436106043576000357c0100000000000000000000000000000000000000000000000000000000900480631865c57d146048578063c19d93fb146070575b600080fd5b348015605357600080fd5b50605a6098565b6040518082815260200191505060405180910390f35b348015607b57600080fd5b50608260a1565b6040518082815260200191505060405180910390f35b60008054905090565b6000548156fea165627a7a72305820b118682270af01d6061a2c91ba2b4b9fcff5384e590e61feef96b98adbdf96410029" // await web3.eth.getCode(contractAddress);

        const result = await getGasPerLineCost(
            [sampleFileName],
            sourceMap,
            bytecode,
            originalSourceCode,
            traceJSONSample
        ) // ,

        console.log(`The result is ${JSON.stringify(result)}`)

        expect(true).toEqual(true)
    })

    it.skip("generate the gas profiler report using GANACHE trace", async () => {
        const traceJSONSample = JSON.parse(
            fs.readFileSync(path.join(__dirname, TRACE_SAMPLE_GANACHE_FILE), "utf8")
        )

        const bytecode =
            "608060405234801561001057600080fd5b506103e860008190555060d3806100286000396000f3fe6080604052600436106043576000357c0100000000000000000000000000000000000000000000000000000000900480631865c57d146048578063c19d93fb146070575b600080fd5b348015605357600080fd5b50605a6098565b6040518082815260200191505060405180910390f35b348015607b57600080fd5b50608260a1565b6040518082815260200191505060405180910390f35b60008054905090565b6000548156fea165627a7a72305820b118682270af01d6061a2c91ba2b4b9fcff5384e590e61feef96b98adbdf96410029" // await web3.eth.getCode(contractAddress);

        const result = await getGasPerLineCost(
            [sampleFileName],
            sourceMap,
            bytecode,
            originalSourceCode,
            traceJSONSample
        ) // ,

        console.log(`The result is ${JSON.stringify(result)}`)

        expect(true).toEqual(true)
    })

    it("generate the gas profiler report using REMIX trace", async () => {
        const traceJSONSample = JSON.parse(
            fs.readFileSync(path.join(__dirname, TRACE_SAMPLE_REMIX_FILE), "utf8")
        )

        const bytecode =
            "608060405234801561001057600080fd5b506103e860008190555060d3806100286000396000f3fe6080604052600436106043576000357c0100000000000000000000000000000000000000000000000000000000900480631865c57d146048578063c19d93fb146070575b600080fd5b348015605357600080fd5b50605a6098565b6040518082815260200191505060405180910390f35b348015607b57600080fd5b50608260a1565b6040518082815260200191505060405180910390f35b60008054905090565b6000548156fea165627a7a72305820b118682270af01d6061a2c91ba2b4b9fcff5384e590e61feef96b98adbdf96410029" // await web3.eth.getCode(contractAddress);

        const result = await getGasPerLineCost(
            [sampleFileName],
            sourceMap,
            bytecode,
            originalSourceCode,
            traceJSONSample
        ) // ,

        console.log(`The result is ${JSON.stringify(result)}`)

        expect(true).toEqual(true)
    })

    it.skip("generate the gas profiler report using GETH trace", async () => {
        const traceJSONSample = JSON.parse(
            fs.readFileSync(path.join(__dirname, TRACE_SAMPLE_GETH_FILE), "utf8")
        )

        // console.log("traceJSONSample", traceJSONSample)

        const bytecode =
            "608060405234801561001057600080fd5b506103e860008190555060d3806100286000396000f3fe6080604052600436106043576000357c0100000000000000000000000000000000000000000000000000000000900480631865c57d146048578063c19d93fb146070575b600080fd5b348015605357600080fd5b50605a6098565b6040518082815260200191505060405180910390f35b348015607b57600080fd5b50608260a1565b6040518082815260200191505060405180910390f35b60008054905090565b6000548156fea165627a7a72305820b118682270af01d6061a2c91ba2b4b9fcff5384e590e61feef96b98adbdf96410029" // await web3.eth.getCode(contractAddress);

        const result = await getGasPerLineCost(
            [sampleFileName],
            sourceMap,
            bytecode,
            originalSourceCode,
            traceJSONSample
        ) // ,

        console.log(`The result is ${JSON.stringify(result)}`)

        expect(true).toEqual(true)
    })

    it.only("generate the gas profiler report using REMIX traces with multiple files", async () => {
        const traceJSONSample = JSON.parse(
            fs.readFileSync(path.join(__dirname, TRACE_MULTIPLE_FILES_REMIX), "utf8")
        )

        const bytecode =
            "608060405234801561001057600080fd5b506103e86000819055506103e860018190555060d7806100316000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80636646d524146037578063d7ffa3f6146062575b600080fd5b606060048036036020811015604b57600080fd5b8101908080359060200190929190505050608d565b005b608b60048036036020811015607657600080fd5b81019080803590602001909291905050506097565b005b8060008190555050565b806001819055505056fea2646970667358221220a8fb7912b2dec9e39dc5ff279d246f788ce5ed46a4d0e69a7446db0a89dd9bc764736f6c63430007040033" // await web3.eth.getCode(contractAddress);

        const result = await getGasPerLineCost(
            [sampleFileName],
            "97:193:0:-:0;;;158:43;;;;;;;;;;153:4:1;144:6;:13;;;;190:4:0;182:5;:12;;;;97:193;;;;;;",
            bytecode,
            `// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.8.0;

import "./ContractB.sol";

contract ContractA is ContractB{
    uint256 price;
    
    constructor() {
        price = 1000;
    }
    
    function setPriceOnA(uint256 value) public {
        price = value;    
    }
}`,
            traceJSONSample
        )

        console.log(`The result is ${JSON.stringify(result)}`)

        expect(true).toEqual(true)
    })
})
