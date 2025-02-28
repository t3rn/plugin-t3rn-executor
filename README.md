Welcome to the t3rn Executor Setup! This guided process will help you configure your executor with ease, providing step-by-step instructions to ensure a smooth start. Let's get you set up and ready to operate efficiently across multiple blockchain networks.

# Preinstallation

Install nvm and configure nodejs:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install
nvm use
```

Install direnv:

```bash
curl -sfL https://direnv.net/install.sh | bash
```

To install the required package manager, run the following commands:

```bash
npm install -g pnpm
```

Verify the installation by running:

```bash
which pnpm
```

# Installation

Clone the Executor repository by running:

```bash
git clone git@github.com:t3rn/executor.git
```

Once you have installed the necessary dependencies, navigate to the root folder of the repository and run the following command:

```bash
pnpm install
```

This will install all the required packages and dependencies for the project.

# Configure Settings and Environment Required Variables

We have provided `.envrc` with default values, you can copy sensitive environment variables to `.envrc.local` (which is in gitignore) and modify them.

1. Add your Executor Private Key `export PRIVATE_KEY_EXECUTOR=0xdead93c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56dbeef`
2. Add your preferred networks to operate on `export ENABLED_NETWORKS='base-sepolia,optimism-sepolia,l1rn'`
3. Set your preferred Node Environment `export ENVIRONMENT=testnet`

# Configure Your Arbitrage Strategies (optional)

Configure your Arbitrage Strategies for your enabled networks in `src/config/executor-arbitrage-strategies.ts` file.

# Start

To start the Executor, run:

```bash
pnpm start:executor
```