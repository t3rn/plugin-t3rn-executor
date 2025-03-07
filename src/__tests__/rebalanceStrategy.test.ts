import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stringToUuid, type Memory } from '@elizaos/core';
import { rebalanceStrategy } from '../actions/rebalanceStrategy';

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
                strategies: {
                    "l0rn": {
                        "eth": {
                            minProfitPerOrder: "2000000000000000000",
                            minProfitRate: 0.02,
                            maxAmountPerOrder: "200000000000000000000",
                            minAmountPerOrder: "2000000000000000000",
                            maxShareOfMyBalancePerOrder: 30
                        }
                    }
                }
            }
        })
    };
});

vi.mock('viem', () => ({
    formatEther: (bn: bigint) => bn.toString()
}));

describe('Executor Rebalance Strategy Action', () => {
    let mockRuntime: any;
    let mockCallback: any;
    let message: Memory;
    let initialStrategies: any;
    let storedStrategies: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockCallback = vi.fn();

        // Define initial arbitrage strategies for the executor.
        initialStrategies = {
            "l0rn": {
                "eth": {
                    minProfitPerOrder: "1000000000000000000",
                    minProfitRate: 0.01,
                    maxAmountPerOrder: "100000000000000000000",
                    minAmountPerOrder: "1000000000000000000",
                    maxShareOfMyBalancePerOrder: 25
                }
            },
            "arbt": {
                "t3BTC": {
                    minProfitPerOrder: "1000000000000000000",
                    minProfitRate: 0.01,
                    maxAmountPerOrder: "100000000000000000000",
                    minAmountPerOrder: "1000000000000000000",
                    maxShareOfMyBalancePerOrder: 30
                }
            }
        };
        // Clone to simulate executor's stored strategies.
        storedStrategies = JSON.parse(JSON.stringify(initialStrategies));

        // Setup a dummy runtime with required methods and settings.
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
            content: { text: 'Update arbitrage strategy' },
            userId: stringToUuid('TEST_USER_ID'),
            agentId: stringToUuid('TEST_AGENT_ID'),
            roomId: stringToUuid('TEST_ROOM_ID')
        } as Memory;
    });

    describe('Action Validation', () => {
        it('should validate settings successfully', async () => {
            expect(await rebalanceStrategy.validate(mockRuntime, message)).toBe(true);
        });
    });

    describe('Action Handler', () => {
        it('should process arbitrage strategy update successfully', async () => {
            // Arrange: Create a mock executor that simulates get and set for arbitrage strategies.
            const mockExecutor = {
                getArbitrageStrategies: vi.fn(() => storedStrategies),
                setArbitrageStrategies: vi.fn((newStrategies) => { storedStrategies = newStrategies; })
            };

            // Have getExecutor return the mock executor.
            const { getExecutor } = await import('@t3rn/executor');
            (getExecutor as any).mockResolvedValue(mockExecutor);

            // Act: Call the handler.
            const result = await rebalanceStrategy.handler(
                mockRuntime,
                message,
                undefined,
                {},
                mockCallback
            );

            // Assert: The handler should return true, call the callback with a success message,
            // and update strategies via setArbitrageStrategies.
            expect(result).toBe(true);
            expect(mockExecutor.setArbitrageStrategies).toHaveBeenCalled();
        });

        it('should handle invalid arbitrage strategy content gracefully', async () => {
            // Arrange: Override generateObject to return an invalid structure.
            const { generateObject } = await import('@elizaos/core');
            (generateObject as any).mockResolvedValue({
                object: {
                    strategies: '' // Empty string should fail schema validation.
                }
            });

            // Act: Call the handler with the invalid generated content.
            const result = await rebalanceStrategy.handler(
                mockRuntime,
                message,
                undefined,
                {},
                mockCallback
            );

            // Assert: The handler should return false and trigger the callback with an error message.
            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining('Could not rebalance arbitrage strategy')
                })
            );
        });
    });
});
