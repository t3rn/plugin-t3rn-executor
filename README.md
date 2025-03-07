# Plugin Executor

A plugin for optimizing cryptocurrency execution strategies for executors within the t3rn ecosystem.

## Developing and Testing
[View instructions on how to develop this plugin here](docs/HOW_TO_DEVELOP.md)

[View instructions on how to test this plugin here](docs/HOW_TO_TEST.md)

[Read a development article here](docs/DEV_ARTICLE.md)

## Overview

t3rn AI Executor analyzes your wallet balances and arbitrage strategies across multiple networks. It leverages real-time market data, historical performance metrics, and advanced AI analysis to automatically rebalance the executor's wallet balances and arbitrage strategy to ensure maximum profitability.

Eliza Plugin Executor extends the functionality of the [t3rn](https://www.t3rn.io/) executor by incorporating AI-driven rebalancing decisions and strategy optimizations.

## Installation

```bash
pnpm add @elizaos-plugins/plugin-executor
```

## Configuration

We have provided `.envrc` with default values; you can copy sensitive environment variables to `.envrc.local` or `.env` and modify them.
If you set up `.env` you must remove 'export' prefixes.
Set up your environment with the required variables:

| Variable Name              | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| `ENVIRONMENT`              | Deployment environment (testnet, mainnet, devnet)                 |
| `LOG_PRETTY`               | Enable pretty logging output                                      |
| `LOG_LEVEL`                | Set log level (debug)                                             |
| `APP_NAME`                 | Name of the application, e.g.: executor                           |
| `PRIVATE_KEY_EXECUTOR`     | Private key for the executor, starting with 0x                    |
| `PRICER_URL`               | URL for the pricer API                                            |
| `OPENAI_API_KEY`           | API key for OpenAI integration                                    |
| `DISABLE_AI_EXECUTOR_AUTORUN`         | Disable executor analysis (enable chat instead)                   |
| `DISABLE_EXECUTOR_AUTORUN` | Mandatory flag to disable executor autorun                        |


## Usage

```typescript
import { executorPlugin } from "@elizaos-plugins/plugin-executor";

// Use the plugin in your agent
{
    name: "Executor",
    username: "executor",
    modelProvider: ModelProviderName.OPENAI,
    plugins: [executorPlugin],
    // ...rest of character
}
```

## Actions

### START_ANALYSIS

**Description:**  
Analyzes market conditions and internal performance metrics to decide whether wallet or strategy rebalancing is needed.

**Features:**
- Retrieves enabled networks, current balances, and arbitrage strategies.
- Combines data from the pricer API and historical performance metrics.
- Provides detailed reasoning and actionable recommendations.
- Specifies the interval before the next analysis should run.

**Examples:**
- "Start analysis"
- "Analyze current market conditions"

**Demo:**
![alt text](<./screenshots/demo1.png>)

---

### SEND_TOKEN

**Description:**  
Rebalances tokens in the executor's wallet by transferring assets between networks when market conditions dictate.

**Features:**
- Monitors token balances and market conditions.
- Issues commands for token transfers based on profitability analysis.
- Integrates with the executor's state management system.

**Examples:**
- "Send 0.001 ETH from arbt to opst"
- "Bridge 1 t3BTC from l1rn to lint"
- "Swap 1 ETH to DOT from sepl to bsc"

**Demo:**
![alt text](<./screenshots/demo2.png>)

---

### REBALANCE_STRATEGY

**Description:**  
Adjusts the executor's arbitrage strategy parameters across multiple networks to maximize profit.

**Features:**
- Evaluates current arbitrage settings against historical performance data.
- Suggests adjustments to parameters like minimum profit per order and order limits.
- Merges new recommendations with existing strategy settings.

**Examples:**
- "Rebalance arbitrage strategy for network arbt with the following parameters: {\"eth\": {\"minProfitPerOrder\": \"6000000000000000000\", \"minProfitRate\": \"6\", \"maxAmountPerOrder\": \"60000000000000000000\", \"minAmountPerOrder\": \"60000000000000\", \"maxShareOfMyBalancePerOrder\": 60}}"

**Demo:**
![alt text](<./screenshots/demo3.png>)

---
*Note*: Action response speed may be influenced by RPCs health condition.

## Autonomy

t3rn AI Executor is designed to run the base t3rn executor code while at the same time taking advantage of AI Agents.

To run in autonomous mode:
1. Update in .env:
```bash
DISABLE_AI_EXECUTOR_AUTORUN=false
```

2. `pnpm start`

In autonomous mode, the AI executor continuously analyzes market data, wallet balances, and arbitrage strategies to automatically trigger rebalancing actions—ensuring that the executor is always operating at optimal profitability without manual intervention.

This integrated mode allows for seamless automation where:
- The classic executor handles core t3rn execution functionalities.
- The AI executor constantly monitors market conditions and performance metrics.
- Decisions on wallet rebalancing and arbitrage strategy adjustments are made in real time.
- Automated commands are issued to rebalance the wallet and update arbitrage strategies accordingly.

**Demo:**
![alt text](<./screenshots/demo4.png>)

## Tests
```bash
cd packages/plugin-executor && pnpm test
```

## Response Format

All actions return structured data including:
- Formatted text for easy reading.
- Raw data for programmatic use.
- Request parameters used.
- Error details when applicable.

## Error Handling

The plugin handles various error scenarios:
- Invalid configurations or parameters.
- Mismatches between expected and actual market conditions.
- Internal state or messaging errors.