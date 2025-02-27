import { Plugin } from "@elizaos/core";
import { rebalanceWalletAction } from "./actions/rebalanceWalletAction.ts";
import { analyzeConditionsAction } from "./actions/analyzeConditionsAction.ts";
import { rebalanceStrategyAction } from "./actions/rebalanceStrategyAction.ts";

export const rebalancerPlugin: Plugin = {
	name: "rebalancer",
	description: "Rebalancer Plugin for Executor",
	actions: [analyzeConditionsAction, rebalanceStrategyAction, rebalanceWalletAction],
	evaluators: [],
	providers: [],
};