import { Action, Character, Evaluator, Provider } from '@elizaos/core'

export interface CustomCharacter extends Character {
    actions: Action[]
    evaluators: Evaluator[]
    providers: Provider[]
}

export interface AnalyzeActionResponse {
    shouldRebalanceWallet: boolean;
    shouldRebalanceStrategy: boolean;
    walletReasoning: string;
    strategyReasoning: string;
    checkAgainInSec: number;
    walletRebalanceCommand?: string;
    strategyRebalanceCommand?: string;
}