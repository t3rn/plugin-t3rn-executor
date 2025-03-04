export interface AnalyzeActionResponse {
    shouldRebalanceWallet: boolean;
    shouldRebalanceStrategy: boolean;
    walletReasoning: string;
    strategyReasoning: string;
    checkAgainInSec: number;
    walletRebalanceCommand?: string;
    strategyRebalanceCommand?: string;
}