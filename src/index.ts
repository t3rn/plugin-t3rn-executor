import { Plugin } from "@elizaos/core";
import { rebalanceWallet } from "./actions/rebalanceWallet.ts";
import { analyzeConditions } from "./actions/analyzeConditions.ts";
import { rebalanceStrategy } from "./actions/rebalanceStrategy.ts";
import { executorAnalysis } from "./services/analysis.ts";

export const executorPlugin: Plugin = {
	name: "ai-executor",
	description: "AI Plugin for Executor",
	actions: [analyzeConditions, rebalanceStrategy, rebalanceWallet],
	evaluators: [],
	providers: [],
	services: [executorAnalysis]
};