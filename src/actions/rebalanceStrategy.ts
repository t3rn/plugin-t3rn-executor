import type { Action } from "@elizaos/core";
import {
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    elizaLogger,
    composeContext,
    generateObject,
} from "@elizaos/core";
import { z } from "zod";
import { validateConfig } from "../environment.ts";
import { useGetAccount } from "../hooks/useGetAccount.ts";
import { getExecutor } from "@t3rn/executor";
import { convertBigNumbersToString, deepClone } from "../utils/helpers.ts";
import { formatEther } from "viem";
import { rebalanceStrategyExamples } from "../examples.ts";

const OrderArbitrageStrategySchema = z.object({
    minProfitPerOrder: z.string(),
    minProfitRate: z.number(),
    maxAmountPerOrder: z.string(),
    minAmountPerOrder: z.string(),
    maxShareOfMyBalancePerOrder: z.number(),
});

const ArbitrageStrategyRebalanceSchema = z.record(
    z.record(OrderArbitrageStrategySchema)
);

const validatedSchema = z.object({
    strategies: ArbitrageStrategyRebalanceSchema,
});

interface ArbitrageStrategyContent extends Content {
    strategies: {
        [networkId: string]: {
            [assetSymbol: string]: {
                minProfitPerOrder: string;
                minProfitRate: number;
                maxAmountPerOrder: string;
                minAmountPerOrder: string;
                maxShareOfMyBalancePerOrder: number;
            };
        };
    };
}

const rebalanceStrategyTemplate = `Respond ONLY with a JSON markdown block containing the extracted values. Do not output any extra text. The JSON must match EXACTLY the structure shown in the example.

IMPORTANT:
- Your output MUST include a top-level key "strategies".
- Under "strategies", each key must be a network ID (e.g., "l0rn", "arbt", "opst").
- For each network, the value MUST be an object whose keys are asset symbols (e.g., "eth", "t3BTC").
- Each asset symbol must map to an object with EXACTLY these keys:
  - "minProfitPerOrder": a string (in wei)
  - "minProfitRate": a number
  - "maxAmountPerOrder": a string (in wei)
  - "minAmountPerOrder": a string (in wei)
  - "maxShareOfMyBalancePerOrder": a number
- Under NO circumstances should any of these keys have a null value.
- If the user message does not specify a new value for any field, use the current existing value for that field.
- Do not include any additional keys, whitespace, or comments.

Example response:
\`\`\`json
{
  "strategies": {
    "l0rn": {
      "eth": {
        "minProfitPerOrder": "1000000000000000000",
        "minProfitRate": 0.01,
        "maxAmountPerOrder": "100000000000000000000",
        "minAmountPerOrder": "1000000000000000000",
        "maxShareOfMyBalancePerOrder": 25
      }
    },
    "arbt": {
      "t3BTC": {
        "minProfitPerOrder": "1000000000000000000",
        "minProfitRate": 0.01,
        "maxAmountPerOrder": "100000000000000000000",
        "minAmountPerOrder": "1000000000000000000",
        "maxShareOfMyBalancePerOrder": 30
      }
    },
    "opst": {
      "eth": {
        "minProfitPerOrder": "1000000000000000000",
        "minProfitRate": 0.01,
        "maxAmountPerOrder": "100000000000000000000",
        "minAmountPerOrder": "1000000000000000000",
        "maxShareOfMyBalancePerOrder": 30
      },
      "t3BTC": {
        "minProfitPerOrder": "1000000000000000000",
        "minProfitRate": 0.01,
        "maxAmountPerOrder": "100000000000000000000",
        "minAmountPerOrder": "1000000000000000000",
        "maxShareOfMyBalancePerOrder": 30
      }
    }
  }
}
\`\`\`

User message:
"{{currentMessage}}"

Instructions:
- Extract the arbitrage strategy rebalance parameters exactly from the user message.
- Your output MUST follow the structure of the example above:
    - A top-level "strategies" key.
    - Each network key must map to an object.
    - That object must contain one or more asset symbol keys (e.g., "eth").
    - Each asset symbol must map to an object with the five specified keys.
- If the user message does not provide a new value for any field, use the current existing value instead of null.
- Do not include any extra keys or additional text.

Respond with a JSON markdown block following EXACTLY the structure in the example.`;

export const rebalanceStrategy: Action = {
    name: "REBALANCE_STRATEGY",
    similes: [
        "REBALANCE_ARBITRAGE_STRATEGY",
        "REBALANCE_STRATEGY",
        "REBALANCE_EXECUTOR_STRATEGY",
        "REBALANCE_SWAP_STRATEGY",
        "REBALANCE_BRIDGE_STRATEGY",
    ],
    validate: async (_runtime: IAgentRuntime) => {
        validateConfig();
        return true;
    },
    description: "Rebalance executor's arbitrage strategy",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback,
    ): Promise<boolean> => {
        elizaLogger.info("Starting REBALANCE_STRATEGY handler...");

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        const account = useGetAccount();
        const executorAddress = account.address;

        // Compose transfer context
        currentState.currentMessage = message.content.text;

        try {
            const executor = await getExecutor();
            const executorArbitrageStrategy = executor.getArbitrageStrategies();

            const transferContext = composeContext({
                state: currentState,
                template: rebalanceStrategyTemplate,
            });
            // Generate content using the AI agent's response.
            const content = (
                await generateObject({
                    runtime,
                    context: transferContext,
                    modelClass: ModelClass.MEDIUM,
                    schema: validatedSchema as any,
                })
            ).object as ArbitrageStrategyContent;

            const input = {
                strategies: content.strategies,
            };

            // Validate the extracted strategies.
            const result = validatedSchema.safeParse(input);
            if (!result.success) {
                elizaLogger.error(
                    { executor: executorAddress, input, error: result.error.message },
                    "Could not rebalance arbitrage strategy. Did not extract valid parameters.",
                );
                if (callback) {
                    callback({
                        text: "Could not rebalance arbitrage strategy. Did not extract valid parameters.",
                        content: { error: result.error.message, ...input, executor: executorAddress },
                    });
                }
                return false;
            }

            const { strategies } = result.data;

            // Deep clone the existing strategies to avoid mutation
            const originalStrategies = deepClone(executorArbitrageStrategy);
            const formattedArbitrageStrategy = convertBigNumbersToString(originalStrategies);
            const newStrategies = { ...formattedArbitrageStrategy };

            // For each network and asset, merge the new values with the current values.
            for (const network in strategies) {
                if (!newStrategies[network]) {
                    newStrategies[network] = {};
                }
                for (const asset in strategies[network]) {
                    const newStrategy = strategies[network][asset];
                    const currentStrategy = formattedArbitrageStrategy[network]?.[asset];
                    newStrategies[network][asset] = {
                        minProfitPerOrder:
                            newStrategy.minProfitPerOrder !== undefined
                                ? newStrategy.minProfitPerOrder
                                : currentStrategy.minProfitPerOrder,
                        minProfitRate:
                            newStrategy.minProfitRate !== undefined
                                ? newStrategy.minProfitRate
                                : currentStrategy.minProfitRate,
                        maxAmountPerOrder:
                            newStrategy.maxAmountPerOrder !== undefined
                                ? newStrategy.maxAmountPerOrder
                                : currentStrategy.maxAmountPerOrder,
                        minAmountPerOrder:
                            newStrategy.minAmountPerOrder !== undefined
                                ? newStrategy.minAmountPerOrder
                                : currentStrategy.minAmountPerOrder,
                        maxShareOfMyBalancePerOrder:
                            newStrategy.maxShareOfMyBalancePerOrder !== undefined
                                ? newStrategy.maxShareOfMyBalancePerOrder
                                : currentStrategy.maxShareOfMyBalancePerOrder,
                    };
                }
            }

            // Strategy setter needs to take in ether
            for (const network in newStrategies) {
                for (const asset in newStrategies[network]) {
                    const strategy = newStrategies[network][asset];
                    strategy.minProfitPerOrder = formatEther(BigInt(strategy.minProfitPerOrder));
                    strategy.maxAmountPerOrder = formatEther(BigInt(strategy.maxAmountPerOrder));
                    strategy.minAmountPerOrder = formatEther(BigInt(strategy.minAmountPerOrder));
                }
            }

            // Update the executor's internal arbitrage strategies with the merged result
            executor.setArbitrageStrategies(newStrategies);

            // Cross check
            const updatedStrategyFromExecutor = executor.getArbitrageStrategies();
            const updatedFormattedStrategy = convertBigNumbersToString(updatedStrategyFromExecutor);
            // Convert fetched strategies to ether for comparison
            for (const network in updatedFormattedStrategy) {
                for (const asset in updatedFormattedStrategy[network]) {
                    const strategy = updatedFormattedStrategy[network][asset];
                    strategy.minProfitPerOrder = formatEther(BigInt(strategy.minProfitPerOrder));
                    strategy.maxAmountPerOrder = formatEther(BigInt(strategy.maxAmountPerOrder));
                    strategy.minAmountPerOrder = formatEther(BigInt(strategy.minAmountPerOrder));
                }
            }
            if (JSON.stringify(newStrategies) !== JSON.stringify(updatedFormattedStrategy)) {
                throw new Error("Cross check failed: updated strategies do not match the executor's stored strategies.")
            }

            if (callback) {
                callback({
                    text: `Arbitrage Strategy for Executor ${executorAddress} has been rebalanced successfully!`,
                    content: {
                        strategies: result.data,
                        executor: executorAddress,
                    }
                });
            }

            return true
        } catch (error: any) {
            elizaLogger.error({ error: error.message }, "Error during arbitrage strategy rebalance");
            if (callback) {
                callback({
                    text: `Error rebalancing arbitrage strategy: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
    examples: rebalanceStrategyExamples
};
