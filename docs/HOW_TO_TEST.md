# Testing Guide for t3rn Executor Plugin

The Eliza Executor Plugin extends the functionality of the [t3rn](https://www.t3rn.io/) executor by incorporating AI-driven rebalancing decisions and strategy optimizations. In order to test this plugin, we have provided a `.env` file to quickly get up to speed.

## Setup
1. Clone `elizaos` repo
```bash
git clone https://github.com/elizaOS/eliza.git
```

2. Set `nvm` to 23.3.0
```bash
nvm use 23.3.0
```

3. Install the t3rn executor plugin:
```bash
npx elizaos plugins install @elizaos-plugins/plugin-executor
```

4. We have provided a customized executor character preloaded with the plugin:

Move `packages/plugin-executor/characters/executor.character.ts` to `agent/src/executor.character.ts`.

Then in `agent/src/index.ts` replace all instances of `defaultCharacter` with the new `AIExecutor` and adjust the import.

5. Create a `.env` file in the root directory and paste these variables:
**Note** Fill in your own `OPENAI_API_KEY`.

```bash
# # ============================ GENERAL SETTINGS ============================
ENVIRONMENT=devnet
LOG_PRETTY=true
LOG_LEVEL=debug
APP_NAME=executor

# # ============================ EXECUTOR SETTINGS ============================
# Executor pk for eliza testing
PRIVATE_KEY_EXECUTOR=0x10ff16755b50468c8b8cc9a966a25f286bbadf0addcfb847b614c4855d70750f

# # ============================ PRICER ============================
PRICER_URL='https://api.t0rn.io'

OPENAI_API_KEY=sk-******

DISABLE_AI_EXECUTOR_AUTORUN=true
DISABLE_EXECUTOR_AUTORUN=true

# RPC endpoints for eliza testing
RPC_ENDPOINTS={"l0rn":["http://178.63.74.220:8449"],"l1rn":["https://brn.calderarpc.com/http"],"l2rn":["https://b2n.rpc.caldera.xyz/http"],"l3rn":[],"zero":[],"t1rn":[],"t2rn":[],"t3rn":[],"lol3":["http://0.0.0.0:8547"],"lold":["http://0.0.0.0:8546"],"lols":["http://0.0.0.0:8545"],"arbm":["https://arb1.arbitrum.io/rpc"],"arbt":["https://arb-sepolia.g.alchemy.com/v2/yh3Bq2t2KlW3k4-4CtD21u_3kuDPfIO3"],"basm":["https://rpc.notadegen.com/base"],"bast":["https://base-sepolia.g.alchemy.com/v2/yh3Bq2t2KlW3k4-4CtD21u_3kuDPfIO3"],"bsct":["https://data-seed-prebsc-1-s2.bnbchain.org:8545"],"bscm":["https://bsc-dataseed.binance.org"],"ethm":["https://eth.llamarpc.com,https://rpc.mevblocker.io/fullprivacy,https://api.tatum.io/v3/blockchain/node/ethereum-mainnet,https://eth.llamarpc.com"],"sept":["https://ethereum-sepolia-rpc.publicnode.com"],"linm":["https://linea.blockpi.network/v1/rpc/public"],"lint":["https://linea-sepolia.g.alchemy.com/v2/yh3Bq2t2KlW3k4-4CtD21u_3kuDPfIO3"],"optm":["https://mainnet.optimism.io"],"opst":["https://opt-sepolia.g.alchemy.com/v2/yh3Bq2t2KlW3k4-4CtD21u_3kuDPfIO3"],"absm":[],"abst":["https://api.testnet.abs.xyz"],"berm":[],"bert":["https://berachain-bartio.g.alchemy.com/v2/yh3Bq2t2KlW3k4-4CtD21u_3kuDPfIO3"],"lskm":[],"lskt":["https://rpc.sepolia-api.lisk.com"],"ctim":[],"ctit":[],"unim":["https://unichain-rpc.publicnode.com"],"unit":["https://unichain-sepolia.g.alchemy.com/v2/yh3Bq2t2KlW3k4-4CtD21u_3kuDPfIO3"],"blsm":[],"blst":["https://blast-sepolia.g.alchemy.com/v2/yh3Bq2t2KlW3k4-4CtD21u_3kuDPfIO3"],"scrm":[],"scrt":["https://sepolia-rpc.scroll.io"]}
```

6. At last run:
```bash
pnpm install
pnpm build
pnpm start
pnpm start:client
```

## Usage
### Actions
[Run these 3 actions to quickly analyze t3rn's integration with Eliza.](../README.md#actions)

### Autonomy
[t3rn AI Executor is designed to run the base t3rn executor code while at the same time taking advantage of AI Agents.](../README.md#autonomy)