import { Action } from "@elizaos/core";
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
import { useGetAccount } from "../hooks/useGetAccount.ts";
import { validateConfig } from "../environment.ts";
import { AnalyzeActionResponse } from "../types.ts";
import { getExecutor } from "@t3rn/executor";
import { convertBigNumbersToString } from "../utils/helpers.ts";
import { NetworkIdT3rn } from "@t3rn/executor/dist/src/pricer/types";
import { analyzeActionExamples } from "../examples.ts";

const AnalyzeSchema = z.object({
    shouldRebalanceWallet: z.boolean(),
    shouldRebalanceStrategy: z.boolean(),
    walletReasoning: z.string(),
    strategyReasoning: z.string(),
    checkAgainInSec: z.number(),
    walletRebalanceCommand: z.string().nullable().optional(),
    strategyRebalanceCommand: z.string().nullable().optional(),
});

export interface AnalyzeContent extends Content {
    shouldRebalanceWallet: boolean;
    shouldRebalanceStrategy: boolean;
    walletReasoning: string;
    strategyReasoning: string;
    checkAgainInSec: number;
    walletRebalanceCommand?: string;
    strategyRebalanceCommand?: string;
}

const validatedSchema = z.object({
    shouldRebalanceWallet: z.boolean(),
    shouldRebalanceStrategy: z.boolean(),
    walletReasoning: z.string(),
    strategyReasoning: z.string(),
    checkAgainInSec: z.number(),
    walletRebalanceCommand: z.string().nullable().optional(),
    strategyRebalanceCommand: z.string().nullable().optional(),
});

const generateAnalyzeTemplate = (data: string) => {
    return `
        You are an advanced AI specializing in crypto execution strategies. Your task is to optimize both the executor's wallet balances and its arbitrage strategy across multiple networks to maximize profitability while ensuring execution efficiency.

        The structured data includes:
        - enabledNetworks: An array of network IDs where the executor operates.
        - balances: An object detailing executor's asset holdings (tokens and amounts - in ether unit) on each network.
        - arbitrageStrategy: An object with the executor's arbitrage strategy preferences for each network and token, including parameters such as minProfitPerOrder, minProfitRate, maxAmountPerOrder, minAmountPerOrder, and maxShareOfMyBalancePerOrder (all values except maxShareOfMyBalancePerOrder are in wei).
        - conditions: An object with constraints such as executor fees, protocol fees, gas fees, and historical performance metrics (profit rates, total orders, executed orders, average execution times, etc.) for each network, along with the executor's ID.

        Your analysis must cover two distinct areas:

        1. Wallet Rebalancing:
           - Analyze the provided data, focusing only on enabled networks.
           - Evaluate each network’s profit rate, fee structures (gas, protocol, executor), and wallet balance distributions.
           - Use historical performance metrics (total orders, executed orders in the last 24 hours, average execution times, etc.) to predict the number of profitable orders in the next hour. For example, you can use:
             
             predictedProfitableOrders = (3600 / averageExecutionTimeSecLast24Hours) * (historicalProfitableOrderRate)
             
             where historicalProfitableOrderRate = (executedOrdersLast24Hours with profit) / (totalOrdersLast24Hours). Adjust this formula as needed.
           - Decide on wallet rebalancing using these criteria:
             • Wallet rebalancing is recommended if the profit rate of the most profitable network exceeds that of the least profitable network by more than 20% AND the least profitable network's profit rate is below 90%.
           - If rebalancing is recommended, compute the optimal command in the format:
             
             "Bridge {amount}{token} from networkA to networkB"
             
             where networkA is the most profitable and networkB is the least profitable network. Network id shall be provided as is, e.g., l0rn, opst, arbt, etc.
             Always provide a correct/valid command, e.g.: Bridge 0.001ETH from opst to arbt

        2. Arbitrage Strategy Rebalancing:
           - Analyze the arbitrageStrategy settings for each enabled network (consider parameters such as minProfitPerOrder, minProfitRate, and order limits).
           - Compare these strategy parameters against historical performance metrics and fee conditions.
           - Determine if the current arbitrage settings are misaligned with market conditions or can be optimized for better execution profitability.
           - If adjustments are needed, devise a strategy rebalancing command that suggests specific modifications (for example, adjusting the minProfitRate or order limits for a network).
           - If arbitrage strategy rebalancing is recommended, compute the optimal command in the format:
            "Rebalance arbitrage strategy for network {networkId} with the following parameters: {parameters}"
            where {parameters} is a JSON object with the updated parameters for the network, e.g.,
            "l0rn": {
                    "eth": {
                        "minProfitPerOrder": "1000000000000000000",
                        "minProfitRate": 0.01,
                        "maxAmountPerOrder": "100000000000000000000",
                        "minAmountPerOrder": "1000000000000000000",
                        "maxShareOfMyBalancePerOrder": 25
                    },
            }
            "

        3. Output Requirements:
           - Provide your full reasoning in two sections:
             • walletReasoning: A detailed explanation of your wallet rebalancing analysis (including profit rate comparisons, fee considerations, latency impacts, and prediction algorithm outputs).
             • strategyReasoning: A detailed explanation of your arbitrage strategy rebalancing analysis (including parameter assessments, historical trends, and fee implications).
           - Specify the time (in seconds) before the next analysis is recommended (acceptable range: 60 to 7200 seconds).
           - If insufficient data is available to confidently decide on either rebalancing, set the corresponding flag to false.
        
        4. Response Format:
           - Respond with a JSON markdown block containing only the following fields. Use null for any values that cannot be determined:
             • (M) shouldRebalanceWallet: Boolean indicating whether wallet rebalancing is recommended.
             • (M) shouldRebalanceStrategy: Boolean indicating whether arbitrage strategy rebalancing is recommended.
             • (M) checkAgainInSec: A number (between 60 and 7200) representing seconds to wait before the next analysis.
             • (M) walletReasoning: Detailed reasoning behind your wallet rebalancing decision.
             • (M) strategyReasoning: Detailed reasoning behind your arbitrage strategy rebalancing decision.
             • (O) walletRebalanceCommand: The suggested wallet rebalancing command (if applicable), e.g., "Bridge {amount}{token} from networkA to networkB".
             • (O) strategyRebalanceCommand: The suggested arbitrage strategy rebalancing command (if applicable), outlining the recommended adjustments.
        
        Data and conditions:
        '${data}'

        Clearly indicate when to analyze conditions again, and always include your complete reasoning. Use predictive algorithms based on past performance (such as average execution time and order volume over the last 24 hours) to forecast profitable orders in the next hour, and integrate these insights into both your wallet and strategy rebalancing decisions.
    `;
}

export const analyzeConditions: Action = {
    name: "START_ANALYSIS",
    similes: [
        "ANALYZE_CONDITIONS",
        "CHECK_CONDITIONS",
        "VIEW_CONDITIONS",
        "CHECK_MARKET",
        "ANALYZE",
        "REQUEST_CONDITIONS",
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        validateConfig();
        return true;
    },
    description: "Analyze conditions to optimize wallet balances",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback,
    ) => {
        elizaLogger.info("Starting START_ANALYSIS handler...");

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        // Compose balance context
        currentState.currentMessage = message.content.text;

        const account = useGetAccount();
        const executorAddress = account.address;

        try {
            // Get executor instance, config and enabled networks
            const executor = await getExecutor();
            const pricerApi = executor.getPricerApi();
            const enabledNetworksIds = executor.getEnabledNetworksIds();
            const arbitrageStrategy = executor.getArbitrageStrategies();
            // Filter only by enabled networks
            const enabledArbitrageStrategy = Object.fromEntries(
                Object.entries(arbitrageStrategy).filter(([networkId]) =>
                    enabledNetworksIds.includes(networkId as NetworkIdT3rn)
                )
            );

            // Convert bignumbers to string so agent can read it
            const formattedArbitrageStrategy = convertBigNumbersToString(enabledArbitrageStrategy);
            if (!formattedArbitrageStrategy) {
                throw new Error("Unable to fetch arbitrage strategy");
            }

            const balances = await executor.getBalancesWithTokens()
            if (!balances) {
                throw new Error("Unable to fetch balances");
            }

            const conditions = await pricerApi.fetchExecutorConditions(executorAddress)
            if (!conditions) {
                throw new Error("Unable to fetch conditions");
            }

            const combined = {
                enabledNetworks: enabledNetworksIds,
                balances,
                arbitrageStrategy: formattedArbitrageStrategy,
                conditions,
            }

            const analyzeTemplate = generateAnalyzeTemplate(JSON.stringify(combined));

            const analyzeContext = composeContext({
                state: currentState,
                template: analyzeTemplate,
            });

            // Generate balance content
            const content = (
                await generateObject({
                    runtime,
                    context: analyzeContext,
                    modelClass: ModelClass.LARGE,
                    schema: AnalyzeSchema as any,
                })
            ).object as AnalyzeContent;

            const input = {
                shouldRebalanceWallet: content.shouldRebalanceWallet,
                shouldRebalanceStrategy: content.shouldRebalanceStrategy,
                walletReasoning: content.walletReasoning,
                strategyReasoning: content.strategyReasoning,
                checkAgainInSec: content.checkAgainInSec,
                walletRebalanceCommand: content.walletRebalanceCommand,
                strategyRebalanceCommand: content.strategyRebalanceCommand,
            };

            // Validate the params
            const result = validatedSchema.safeParse(input);

            if (!result.success) {
                elizaLogger.error({ executor: executorAddress, input, error: result.error.message },
                    "Conditions could not be analyzed. Did not extract valid parameters.",
                );
                if (callback) {
                    callback({
                        text: "Conditions could not be analyzed. Did not extract valid parameters.",
                        content: { error: result.error.message, ...input, executor: executorAddress },
                    });
                }
                return false;
            }

            const { shouldRebalanceWallet, shouldRebalanceStrategy, walletReasoning, strategyReasoning, walletRebalanceCommand, strategyRebalanceCommand, checkAgainInSec } = result.data;

            const formattedResponse = `
            Analysis completed.
            Wallet Rebalance: ${shouldRebalanceWallet}.
            Strategy Rebalance: ${shouldRebalanceStrategy}.
            Wallet Reasoning: ${walletReasoning}.
            Strategy Reasoning: ${strategyReasoning}.
            Wallet Command: ${walletRebalanceCommand || "N/A"}.
            Strategy Command: ${strategyRebalanceCommand || "N/A"}.
            Check again in: ${checkAgainInSec / 60} minutes.
            Executor: ${executorAddress}
            `.trim();

            if (callback) {
                callback({
                    text: formattedResponse,
                    content: {
                        ...result.data,
                        executor: executorAddress
                    },
                });
            }

            return result.data as AnalyzeActionResponse;
        } catch (error: any) {
            elizaLogger.error({ executor: executorAddress, error: error.message }, "Error analyzing conditions");
            if (callback) {
                callback({
                    text: `Error analyzing conditions: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
    examples: analyzeActionExamples
};
