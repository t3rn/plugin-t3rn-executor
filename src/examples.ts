import { ActionExample } from "@elizaos/core";

export const analyzeActionExamples = [
    [
        {
            user: "{{user1}}",
            content: {
                text: "Start analysis",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "I'll analyze the current market conditions and provide you with a detailed report.",
                action: "START_ANALYSIS",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Based on current market conditions, I recommend rebalancing the wallet.",
            },
        },
    ],
    [
        {
            user: "{{user1}}",
            content: {
                text: "Check conditions of market",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "I'll analyze the current market conditions and provide you with a detailed report.",
                action: "START_ANALYSIS",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Based on current market conditions, I recommend no further action.",
            },
        },
    ],
    [
        {
            user: "{{user1}}",
            content: {
                text: "Start market analysis",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "I'll analyze the current market conditions and provide you with a detailed report.",
                action: "START_ANALYSIS",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "I recommend rebalancing wallet on opst network by 10%.",
            },
        },
    ],
    [
        {
            user: "{{user1}}",
            content: {
                text: "Start analysis",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "I'll analyze the current market conditions and provide you with a detailed report.",
                action: "START_ANALYSIS",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Based on current market conditions, I recommend rebalancing the executor's arbitrage strategy.",
            },
        },
    ],
] as ActionExample[][]

export const rebalanceStrategyExamples = [
    [
        {
            user: "{{user1}}",
            content: {
                text: "Rebalance arbitrage strategy for network l0rn with the following parameters: {\"eth\": {\"minProfitPerOrder\": \"1000000000000000000\", \"minProfitRate\": 0.01, \"maxAmountPerOrder\": \"100000000000000000000\", \"minAmountPerOrder\": \"20000000000000\", \"maxShareOfMyBalancePerOrder\": 25}}",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Sure, I'll rebalance the executor's arbitrage strategy right away.",
                action: "REBALANCE_STRATEGY",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Successfully rebalanced the executor's arbitrage strategy for network l0rn on token eth.",
            },
        },
    ],
] as ActionExample[][]

export const rebalanceWalletExamples = [
    [
        {
            user: "{{user1}}",
            content: {
                text: "Bridge 0.01 ETH from arbt to opst",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Sure, I'll send 0.01 ETH to your address now from Arbitrum Sepolia to Op Sepolia.",
                action: "SEND_TOKEN",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Successfully sent 0.01 ETH to 0x114B242D931B47D5cDcEe7AF065856f70ee278C4\nTransaction: 0xdde850f9257365fffffc11324726ebdcf5b90b01c6eec9b3e7ab3e81fde6f14b",
            },
        },
    ],
    [
        {
            user: "{{user1}}",
            content: {
                text: "Swap 0.01 ETH to BRN from l1rn to opst",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Sure, I'll swap 0.01 ETH to BRN in your same wallet address now from l1rn to Op Sepolia.",
                action: "SEND_TOKEN",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Successfully swapped 0.01 ETH to BRN on 0x114B242D931B47D5cDcEe7AF065856f70ee278C4\nTransaction: 0xdde850f9257365fffffc11324726ebdcf5b90b01c6eec9b3e7ab3e81fde6f14b",
            },
        },
    ],
    [
        {
            user: "{{user1}}",
            content: {
                text: "Send 0.01 ETH from l0rn to arbt",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Sure, I'll rebalance 0.01 ETH from l0rn to Arbitrum Sepolia in your wallet now.",
                action: "SEND_TOKEN",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Successfully sent 0.01 ETH to Arbitrum Sepolia.\nTransaction: 0xdde850f9257365fffffc11324726ebdcf5b90b01c6eec9b3e7ab3e81fde6f14b",
            },
        },
    ],
    [
        {
            user: "{{user1}}",
            content: {
                text: "Swap 100 USDC to ETH from l2rn to opst",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Sure, I'll swap 100 USDC to ETH in your same wallet address now from l2rn to Op Sepolia.",
                action: "SEND_TOKEN",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Successfully sent 100 USDC to 0xCCa8009f5e09F8C5dB63cb0031052F9CB635Af62\nTransaction: 0x4fed598033f0added272c3ddefd4d83a521634a738474400b27378db462a76ec",
            },
        },
    ],
    [
        {
            user: "{{user1}}",
            content: {
                text: "Bridge 100 USDC",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Seems like you did not provide enough info. Please provide the source and destination networks to proceed.",
                action: "CONTINUE",
            },
        },
        {
            user: "{{user1}}",
            content: {
                text: "Bridge 100 USDC from l3rn to opst",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Sure, I'll bridge 100 USDC in your same wallet address now from l3rn to Op Sepolia.",
                action: "SEND_TOKEN",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "Successfully sent 100 USDC to 0xCCa8009f5e09F8C5dB63cb0031052F9CB635Af62\nTransaction: 0x4fed598033f0added272c3ddefd4d83a521634a738474400b27378db462a76ec",
            },
        },
    ],
] as ActionExample[][]