import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stringToUuid, type Memory } from '@elizaos/core';
import { analyzeConditions } from '../actions/analyzeConditions';
import { getExecutor } from '@t3rn/executor';

vi.mock('@t3rn/executor', () => ({
    getExecutor: vi.fn()
}));

vi.mock('../hooks/useGetAccount.ts', () => ({
    useGetAccount: () => ({ address: 'executor-address' })
}));

vi.mock('@elizaos/core', async () => {
    const actual = await vi.importActual('@elizaos/core');
    return {
        ...actual,
        generateObject: vi.fn().mockResolvedValue({
            object: {
                shouldRebalanceWallet: true,
                shouldRebalanceStrategy: false,
                walletReasoning: "Wallet analysis passed.",
                strategyReasoning: "Strategy analysis passed.",
                checkAgainInSec: 120,
                walletRebalanceCommand: "Bridge 0.001ETH from opst to arbt",
                strategyRebalanceCommand: null
            }
        })
    };
});

vi.mock('viem', () => ({
    formatEther: (bn: bigint) => bn.toString()
}));

describe('Analyze Conditions Action', () => {
    let mockRuntime: any;
    let mockCallback: any;
    let message: Memory;
    let mockExecutor: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCallback = vi.fn();

        // Setup dummy runtime.
        mockRuntime = {
            messageManager: {
                createMemory: vi.fn().mockResolvedValue(true)
            },
            getSetting: vi.fn().mockImplementation((key) => {
                const settings = {
                    ENVIRONMENT: 'devnet',
                    APP_NAME: 'executor',
                    PRIVATE_KEY_EXECUTOR: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
                    PRICER_URL: 'https://api.t0rn.io',
                    OPENAI_API_KEY: 'dummy-openai-key',
                    DISABLE_AI_EXECUTOR_AUTORUN: true,
                    DISABLE_EXECUTOR_AUTORUN: true
                };
                return settings[key];
            }),
            agentId: stringToUuid('TEST_AGENT_ID'),
            composeState: vi.fn().mockResolvedValue({ currentMessage: '' }),
            updateRecentMessageState: vi.fn().mockResolvedValue({ currentMessage: '' })
        };

        message = {
            content: { text: 'Analyze market conditions' },
            userId: stringToUuid('TEST_USER_ID'),
            agentId: stringToUuid('TEST_AGENT_ID'),
            roomId: stringToUuid('TEST_ROOM_ID')
        } as Memory;

        // Create a mock executor with required methods.
        mockExecutor = {
            isShutdownInProgress: false, // Dummy property to avoid shutdown errors.
            getPricerApi: vi.fn(() => ({
                fetchExecutorConditions: vi.fn().mockResolvedValue({ fee: 0.01, gas: 5 })
            })),
            getEnabledNetworksIds: vi.fn(() => ['l0rn', 'arbt']),
            getArbitrageStrategies: vi.fn(() => ({
                l0rn: {
                    eth: {
                        minProfitPerOrder: "1000000000000000000",
                        minProfitRate: 0.01,
                        maxAmountPerOrder: "100000000000000000000",
                        minAmountPerOrder: "1000000000000000000",
                        maxShareOfMyBalancePerOrder: 25
                    }
                },
                arbt: {
                    t3BTC: {
                        minProfitPerOrder: "1000000000000000000",
                        minProfitRate: 0.01,
                        maxAmountPerOrder: "100000000000000000000",
                        minAmountPerOrder: "1000000000000000000",
                        maxShareOfMyBalancePerOrder: 30
                    }
                }
            })),
            getBalancesWithTokens: vi.fn().mockResolvedValue({
                l0rn: { eth: "1" },
                arbt: { t3BTC: "0.5" }
            })
        };

        // Use the imported mocked getExecutor.
        vi.mocked(getExecutor).mockResolvedValue(mockExecutor);
    });

    describe('Action Handler', () => {
        it('should process analysis successfully and call callback with valid response', async () => {
            const result = await analyzeConditions.handler(
                mockRuntime,
                message,
                undefined,
                {},
                mockCallback
            );

            expect(result).toEqual(
                expect.objectContaining({
                    shouldRebalanceWallet: true,
                    shouldRebalanceStrategy: false,
                    walletReasoning: expect.any(String),
                    strategyReasoning: expect.any(String),
                    checkAgainInSec: expect.any(Number)
                })
            );
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining("Analysis completed")
                })
            );
        });

        it('should handle invalid analysis content gracefully', async () => {
            // Force generateObject to return invalid content
            const { generateObject } = await import('@elizaos/core');
            (generateObject as any).mockResolvedValue({
                object: "invalid"
            });

            const result = await analyzeConditions.handler(
                mockRuntime,
                message,
                undefined,
                {},
                mockCallback
            );

            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining("Conditions could not be analyzed")
                })
            );
        });

        it('should handle missing balances error gracefully', async () => {
            // Force getBalancesWithTokens to return null.
            mockExecutor.getBalancesWithTokens = vi.fn().mockResolvedValue(null);

            const result = await analyzeConditions.handler(
                mockRuntime,
                message,
                undefined,
                {},
                mockCallback
            );

            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining("Unable to fetch balances")
                })
            );
        });

        it('should handle exception during processing gracefully', async () => {
            // Force an exception on getPricerApi.
            mockExecutor.getPricerApi = vi.fn(() => {
                throw new Error("Pricer API unreachable");
            });

            const result = await analyzeConditions.handler(
                mockRuntime,
                message,
                undefined,
                {},
                mockCallback
            );

            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining("Error analyzing conditions")
                })
            );
        });
    });
});
