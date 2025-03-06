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
import { NetworkIdT3rn } from "@t3rn/executor/dist/src/pricer/types";
import { AssetName } from "@t3rn/executor/dist/src/pricer/enums";
import { parseEther } from "viem";
import { rebalanceWalletExamples } from "../examples.ts";

const TransferSchema = z.object({
	amount: z.string(),
	sourceNetwork: z.string().nullable(),
	destinationNetwork: z.string().nullable(),
	fromAsset: z.string().nullable(),
	toAsset: z.string().nullable(),
});

const validatedTransferSchema = z.object({
	recipient: z.string().min(1),
	amount: z.string().min(1),
	sourceNetwork: z.string().min(1),
	destinationNetwork: z.string().min(1),
	fromAsset: z.string().min(1),
	toAsset: z.string().min(1),
});

export interface TransferContent extends Content {
	amount: string | number;
	sourceNetwork: NetworkIdT3rn;
	destinationNetwork: NetworkIdT3rn;
	fromAsset: string;
	toAsset: string;
}

const transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "1000",
	"sourceNetwork": "arbt",
	"destinationNetwork": "opst",
	"fromAsset": "eth",
	"toAsset": "brn"
}
\`\`\`

User message:
"{{currentMessage}}"

Given the message, extract the following information about the requested token transfer:
- Amount to transfer
- From asset: The symbol of the token that wants to be swapped. Samples: eth,brn,usdc
- To asset: The symbol of the token that the user wants to receive. Samples: dot,trn,usdt
If no "to asset" is provided, it means the user wants to bridge the same "from asset" to another network, so provide the same value as "from asset".
- Source network: The network where the tokens are currently held.
- Destination network: The network where the tokens should be transferred to.
Networks correlations sample:
{
  absm: 'abstract',
  abst: 'abstract-sepolia',
  arbm: 'arbitrum',
  arbt: 'arbitrum-sepolia',
  basm: 'base',
  bast: 'base-sepolia',
  berm: 'berachain',
  bert: 'berachain-bartio',
  blsm: 'blast',
  blst: 'blast-sepolia',
  bscm: 'binance',
  bsct: 'binance-testnet',
  ctim: 'celestia',
  ctit: 'celestia-mocha',
  ethm: 'ethereum',
  l0rn: 'l0rn',
  l1rn: 'l1rn',
  l2rn: 'l2rn',
  l3rn: 'l3rn',
  linm: 'linea',
  lint: 'linea-sepolia',
  lol3: 'lol3',
  lold: 'lold',
  lols: 'lols',
  lskm: 'lisk-mainnet',
  lskt: 'lisk-sepolia',
  opst: 'optimism-sepolia',
  optm: 'optimism',
  scrm: 'scroll',
  scrt: 'scroll-sepolia',
  sept: 'sepolia',
  t1rn: 't1rn',
  t2rn: 't2rn',
  t3rn: 't3rn',
  unim: 'unichain',
  unit: 'unichain-sepolia',
  zero: 'zero',
}
Networks shall be provided in their short id format: arbt, opst, etc, even when user provides the full name.

Respond with a JSON markdown block containing only the extracted values.`;

export const rebalanceWallet: Action = {
	name: "SEND_TOKEN",
	similes: [
		"REBALANCE_WALLET",
		"TRANSFER_TOKEN",
		"TRANSFER_TOKENS",
		"SEND_TOKENS",
		"SEND_ETH_ON_NETWORK",
		"PAY_ON_NETWORK",
		"MOVE_TOKENS_TO_NETWORK",
		"MOVE_ETH",
		"SWAP_TOKENS",
		"BRIDGE_TOKENS",
		"SWAP_AMOUNT"
	],
	validate: async (_runtime: IAgentRuntime) => {
		validateConfig();
		return true;
	},
	description: "Rebalance tokens in the agent's wallet",
	handler: async (
		runtime: IAgentRuntime,
		message: Memory,
		state: State,
		_options: { [key: string]: unknown },
		callback?: HandlerCallback,
	): Promise<boolean> => {
		elizaLogger.info("Starting SEND_TOKEN handler...");

		// Initialize or update state
		let currentState = state;
		if (!currentState) {
			currentState = (await runtime.composeState(message)) as State;
		} else {
			currentState = await runtime.updateRecentMessageState(currentState);
		}

		// Compose transfer context
		currentState.currentMessage = message.content.text;
		const transferContext = composeContext({
			state: currentState,
			template: transferTemplate,
		});

		// Generate transfer content
		const content = (
			await generateObject({
				runtime,
				context: transferContext,
				modelClass: ModelClass.LARGE,
				schema: TransferSchema as any,
			})
		).object as TransferContent;

		const executor = await getExecutor();
		const account = useGetAccount();
		const config = executor.getConfig();
		const environment = config.environment;
		const executorAddress = account.address;
		const recipient = executorAddress;
		if (!recipient) {
			throw new Error("Invalid recipient address or ENS name");
		}

		// Get all required params for swapping
		const sourceNetwork = content.sourceNetwork.toLowerCase();
		const destinationNetwork = content.destinationNetwork.toLowerCase();
		const fromAsset = content.fromAsset.toLowerCase();
		const toAsset = content.toAsset.toLowerCase();

		const input = {
			recipient,
			amount: content.amount.toString(),
			sourceNetwork,
			destinationNetwork,
			fromAsset,
			toAsset,
		};

		// Validate the params
		const result = validatedTransferSchema.safeParse(input);

		if (!result.success) {
			elizaLogger.error(
				"Invalid content for TRANSFER_TOKEN action.",
				result.error.message,
			);
			if (callback) {
				callback({
					text: "Unable to process transfer request. Did not extract valid parameters.",
					content: { error: result.error.message, ...input },
				});
			}
			return false;
		}

		try {
			const { recipient, amount, sourceNetwork, destinationNetwork, fromAsset, toAsset } = result.data;

			const amountWei = parseEther(amount).toString();

			const { id, txHash, nonce, orderTimestamp, sender } = await executor.rebalanceWallet(
				executorAddress,
				amountWei,
				sourceNetwork as NetworkIdT3rn,
				destinationNetwork as NetworkIdT3rn,
				fromAsset as AssetName,
				toAsset as AssetName,
			)

			if (callback) {
				let txrn = 't0rn';
				switch (environment) {
					case 'devnet':
						txrn = 't0rn';
						break;
					case 'testnet':
						txrn = 't2rn';
						break;
					case 'mainnet':
						txrn = 't3rn';
						break;
				}
				const URL = `https://bridge.${txrn}.io/order/${id}`;

				const formattedResponse = `Wallet Rebalance Success! 
Track it here: ${URL}
Order ID: ${id}
Timestamp: ${orderTimestamp}
TxHash: ${txHash}`;

				callback({
					text: formattedResponse,
					content: {
						id,
						txHash,
						nonce,
						orderTimestamp,
						sender,
						amount,
						recipient,
						address: executorAddress,
						sourceNetwork,
						destinationNetwork,
					},
				});
			}

			return true
		} catch (error: any) {
			elizaLogger.error({ error: error.message }, "Error during token transfer");
			if (callback) {
				callback({
					text: `Error transferring tokens: ${error.message}`,
					content: { error: error.message },
				});
			}
			return false;
		}
	},
	examples: rebalanceWalletExamples
};
