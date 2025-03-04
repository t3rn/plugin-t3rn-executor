import {
    AgentRuntime,
    Content,
    elizaLogger,
    HandlerCallback,
    Memory,
    Service,
    ServiceType,
    State,
    stringToUuid,
} from "@elizaos/core";
import { sleep } from "../utils/utils";
import { getExecutor, startExecutor } from "@t3rn/executor";
import { useGetAccount } from "../hooks/useGetAccount";
import { AnalyzeActionResponse } from "../types";
import { validateConfig } from "../environment";

export const executorAnalysis: Service = {
    serviceType: ServiceType.TEXT_GENERATION,
    initialize: async (runtime: AgentRuntime): Promise<void> => {
        // Validate env variables
        validateConfig();

        const DISABLE_AI_EXECUTOR_AUTORUN = runtime.getSetting("DISABLE_AI_EXECUTOR_AUTORUN");
        if (DISABLE_AI_EXECUTOR_AUTORUN === "true") {
            elizaLogger.warn("Analysis is disabled. Will not start AI Executor.");
            return;
        }

        await startExecutorLib();
        await sleep(10, "Sleep before starting AI Executor");
        await startAIExecutor(runtime);
    },
};

const startExecutorLib = async () => {
    elizaLogger.info("Starting executor");

    // Get the executor instance
    const executor = await getExecutor()

    // Sanity check
    const executorId = executor.getMyAddress()
    const account = useGetAccount()

    if (executorId !== account.address) {
        elizaLogger.error({ executorId, account: account.address }, 'Executor address does not match account address')
        process.exit(1)
    }

    // Start the executor lib instance
    await startExecutor()
}

const startAIExecutor = async (runtime: AgentRuntime) => {
    elizaLogger.info("Starting AI Executor");

    let sleepSec = 60;
    const userId = stringToUuid('executor');
    const roomId = stringToUuid('room-id');

    while (true) {
        try {
            // Create initial memory to instruct agent to start analysis
            const newMemoryId = stringToUuid('unique-id');
            const newMemory: Memory = {
                id: newMemoryId,
                agentId: runtime.agentId,
                userId,
                roomId,
                content: { text: 'Start analysis' },
                createdAt: Date.now(),
            };

            await runtime.messageManager.createMemory(newMemory);

            const recentMemories = await runtime.messageManager.getMemories({
                roomId,
                count: 2, // Number of recent messages to retrieve
            });

            // Get the memory we just created
            const message = recentMemories.find((memory) => memory.id === newMemoryId);
            // Create agent's state
            const currentState = (await runtime.composeState(message)) as State;
            // Get the actions we need
            const analysisAction = runtime.actions.find((action) => action.name === "START_ANALYSIS");
            const rebalanceWalletAction = runtime.actions.find((action) => action.name === "SEND_TOKEN");
            const rebalanceStrategyAction = runtime.actions.find((action) => action.name === "REBALANCE_STRATEGY");
            if (!analysisAction) {
                elizaLogger.error("No analysis action found!");
                return;
            }
            if (!rebalanceWalletAction) {
                elizaLogger.error("No rebalance wallet action found!");
                return;
            }
            if (!rebalanceStrategyAction) {
                elizaLogger.error("No rebalance strategy action found!");
                return;
            }

            // Construct the callback needed for the handlers
            const handlerCallback: HandlerCallback = async (response: Content): Promise<Memory[]> => {
                elizaLogger.info({ content: response.content ?? response }, `Agent: ${response.text?.trim()}`);

                // Create a new Memory object based on the response
                const newMemory: Memory = {
                    id: stringToUuid('new-id'),
                    agentId: runtime.agentId,
                    userId,
                    roomId,
                    content: response,
                    createdAt: Date.now(),
                };

                // Store the new memory using the message manager
                await runtime.messageManager.createMemory(newMemory);

                // Return the new memory in an array
                return [newMemory];
            };

            // Start analyzing
            const result = await analysisAction.handler(runtime, message, currentState, {}, handlerCallback) as AnalyzeActionResponse;
            if (!result) {
                elizaLogger.error("No result found from analysis action");
                return
            }

            const { shouldRebalanceWallet, shouldRebalanceStrategy, walletReasoning, strategyReasoning, walletRebalanceCommand, strategyRebalanceCommand, checkAgainInSec } = result
            // Override sleepSec with what agent suggests
            sleepSec = checkAgainInSec;

            if (!shouldRebalanceWallet && !shouldRebalanceStrategy) {
                elizaLogger.info({ walletReasoning, strategyReasoning, sleepSec }, "Agent considers there's no need to rebalance. Sleep for now.");
                await sleep(sleepSec);
                continue;
            }

            // Rebalance wallet
            if (shouldRebalanceWallet) {
                const newMemoryRebalance: Memory = {
                    id: stringToUuid('rebalance-wallet-id'),
                    agentId: runtime.agentId,
                    userId,
                    roomId,
                    content: { text: walletRebalanceCommand },
                    createdAt: Date.now(),
                };

                const updatedState = await runtime.updateRecentMessageState(currentState);

                await rebalanceWalletAction.handler(runtime, newMemoryRebalance, updatedState, {}, handlerCallback);
            }

            // Rebalance arbitrage strategy
            if (shouldRebalanceStrategy) {
                const newMemoryRebalance: Memory = {
                    id: stringToUuid('rebalance-strategy-id'),
                    agentId: runtime.agentId,
                    userId,
                    roomId,
                    content: { text: strategyRebalanceCommand },
                    createdAt: Date.now(),
                };

                const updatedState = await runtime.updateRecentMessageState(currentState);

                await rebalanceStrategyAction.handler(runtime, newMemoryRebalance, updatedState, {}, handlerCallback);
            }

            elizaLogger.info({ sleepSec }, "Executor analysis completed");
        } catch (error: any) {
            elizaLogger.error({ error: error.message, sleepSec }, "Error in executor analysis:");
        }

        await sleep(sleepSec);
    }
}