# Developing the Eliza AI Agent Plugin Executor for t3rn

Integrating advanced AI-driven execution strategies with the t3rn executor was an exciting yet challenging project. Our journey involved navigating numerous technical hurdles, creative problem-solving, and iterative enhancements. Here's an in-depth, tech-focused recount of our experience developing the Eliza AI Agent Plugin Executor.

## Initial Environment Troubles on macOS

Our first challenge appeared almost immediately after upgrading from an Intel-based Mac to Apple Silicon. We encountered numerous compatibility issues due to mismatched architectures. Essential tools like Homebrew, Node.js, npm, pnpm, and GPG—all initially built for Intel processors—needed complete reinstallation:

```bash
brew reinstall node npm pnpm gpg
```

This step-by-step rebuild required meticulous checks to ensure compatibility with Apple Silicon. Although time-consuming, it created a robust foundation for future development.

## Kickstarting with Eliza-Starter

We initially opted for the [Eliza-Starter repository](https://github.com/elizaOS/eliza-starter) to quickly bootstrap our project. However, we encountered frustrating issues like:

```bash
src/index.ts(1,30): error TS2307: Cannot find module '@elizaos/client-direct' or its corresponding type declarations.
src/index.ts(8,8): error TS2307: Cannot find module '@elizaos/core' or its corresponding type declarations.
src/index.ts(9,33): error TS2307: Cannot find module '@elizaos/plugin-bootstrap' or its corresponding type declarations.
src/index.ts(10,34): error TS2307: Cannot find module '@elizaos/plugin-node' or its corresponding type declarations.
src/index.ts(11,30): error TS2307: Cannot find module '@elizaos/plugin-solana' or its corresponding type declarations.
src/index.ts(12,16): error TS2307: Cannot find module 'fs' or its corresponding type declarations.
src/index.ts(114,32): error TS2503: Cannot find namespace 'NodeJS'.
Error: error occurred in dts build
```

Resolving this required standardizing our Node.js and pnpm versions:

```bash
nvm use 22
pnpm install
```

These steps finally stabilized the development environment, allowing us to move forward smoothly.

## Modularizing the Executor into an NPM Library

To seamlessly integrate our executor code with the Eliza framework, we modularized our original executor codebase into an npm package. This modular approach dramatically simplified integration and allowed simultaneous execution of AI logic and our executor code:

- [@t3rn/executor](https://www.npmjs.com/package/@t3rn/executor)

## Crafting Plugin Actions

Once our environment stabilized and our executor library was set, we focused on developing the core plugin actions. Utilizing Eliza's `Plugin` interface, we structured the plugin effectively:

```typescript
export const rebalancerPlugin: Plugin = {
    name: "rebalancer",
    description: "Rebalancer Plugin for Executor",
    actions: [analyzeConditionsAction, rebalanceStrategyAction, rebalanceWalletAction],
    evaluators: [],
    providers: [],
};
```

These custom actions enabled critical functions such as:
- Real-time market analysis
- Cross-network wallet rebalancing
- Dynamic optimization of arbitrage strategies

These can be found in [our Eliza Starter version](https://github.com/t3rn/eliza-aixecutor).

## Transitioning from Eliza-Starter to ElizaOS

While Eliza-Starter was useful initially, limitations quickly emerged—especially around scalability and ease of deployment. Consequently, we transitioned to ElizaOS, which provided better scalability and integration capabilities aligned with our goals.

We took initiative and developed a standalone ElizaOS plugin, now successfully deployed in the [Eliza Registry](https://github.com/elizaos-plugins/registry/blob/main/index.json#L51) and publicly accessible in [our repository](https://github.com/t3rn/plugin-t3rn-executor).

## Future Improvements and Enhancements

While the core functionality is now stable and operational, we've identified several critical areas for future enhancements:

### 1. Robust Logic and Safety Checks
- Implement strict safety checks to prevent potentially risky operations, such as inadvertently bridging excessively large amounts of tokens. Ensuring smart constraints and validation checks is a top priority.

### 2. Enhanced Logging and Observability
- Guardian logs currently clutter visibility, complicating the monitoring of AI-driven actions. Improving log management by separating AI executor logs into dedicated interfaces or tabs is essential for better debugging and operational transparency.

### 3. Progress Monitoring and Persistent State Management
- The current system lacks effective tracking and visibility into historical AI actions and progress. Since direct access to DynamoDB isn't available, building an intermediary API to facilitate comprehensive state management and progress tracking will significantly enhance the usability of the system.

## Final Thoughts

Developing the Eliza AI Agent Plugin Executor was a rewarding journey through technological hurdles, creative problem-solving, and strategic innovation.