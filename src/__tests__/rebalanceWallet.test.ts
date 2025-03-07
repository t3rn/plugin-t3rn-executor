import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stringToUuid, type Memory } from '@elizaos/core';
import { rebalanceWallet } from '../actions/rebalanceWallet';

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
                amount: "0.001",
                sourceNetwork: "arbt",
                destinationNetwork: "opst",
                fromAsset: "eth",
                toAsset: "eth"
            }
        })
    };
});

describe('Executor Rebalance Wallet Action', () => {
    let mockRuntime: any;
    let mockCallback: any;
    let message: Memory;

    beforeEach(() => {
        vi.clearAllMocks();

        mockCallback = vi.fn();
        mockRuntime = {
            messageManager: {
                createMemory: vi.fn().mockResolvedValue(true)
            },
            getSetting: vi.fn().mockImplementation((key) => {
                // Only the required settings for this action
                const settings = {
                    ENVIRONMENT: 'devnet',
                    APP_NAME: 'executor',
                    PRIVATE_KEY_EXECUTOR: '0xc676eed1aaaaaaaaaa1f05c2d1eeeeeeeeeef632xxxxxxxxxxefffffffadcccc',
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
            content: { text: 'Transfer 0.001 ETH from arbt to opst' },
            userId: stringToUuid('TEST_USER_ID'),
            agentId: stringToUuid('TEST_AGENT_ID'),
            roomId: stringToUuid('TEST_ROOM_ID')
        } as Memory;
    });

    describe('Action Validation', () => {
        it('should validate settings successfully', async () => {
            // validate() only calls validateConfig which is synchronous here.
            expect(await rebalanceWallet.validate(mockRuntime, message)).toBe(true);
        });
    });

    describe('Action Handler', () => {
        it('should process transfer successfully', async () => {
            // Arrange: create a mock executor with a mock rebalanceWallet method
            const mockExecutor = {
                getMyAddress: () => 'executor-address',
                rebalanceWallet: vi.fn().mockResolvedValue({
                    id: 'order-id',
                    txHash: 'tx-hash',
                    nonce: 1,
                    orderTimestamp: 123456789,
                    sender: 'executor-address'
                }),
                getConfig: vi.fn().mockReturnValue({
                    environment: 'devnet',
                }),
            };

            // Get the mocked getExecutor function and have it return our mockExecutor
            const { getExecutor } = await import('@t3rn/executor');
            (getExecutor as any).mockResolvedValue(mockExecutor);

            // Act: Call the handler
            const result = await rebalanceWallet.handler(
                mockRuntime,
                message,
                undefined,
                {},
                mockCallback
            );

            // Assert: the handler should return true and the callback should have been called with success info
            expect(result).toBe(true);
            expect(mockCallback).toHaveBeenCalled();
            expect(mockExecutor.rebalanceWallet).toHaveBeenCalledWith(
                'executor-address',
                expect.any(String), // amount in wei
                'arbt',
                'opst',
                'eth',
                'eth'
            );
        });

        it('should handle invalid transfer content gracefully', async () => {
            // Arrange: override generateObject to return an object with keys, but empty values.
            const { generateObject } = await import('@elizaos/core');
            (generateObject as any).mockResolvedValue({
                object: {
                    amount: "",
                    sourceNetwork: "",
                    destinationNetwork: "",
                    fromAsset: "",
                    toAsset: ""
                }
            });

            // Act: Call the handler with the invalid generated content
            const result = await rebalanceWallet.handler(
                mockRuntime,
                message,
                undefined,
                {},
                mockCallback
            );

            // Assert: the handler should return false and the callback should report an error
            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining('Unable to process transfer request')
                })
            );
        });
    });
});
