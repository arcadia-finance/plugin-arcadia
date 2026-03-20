# @arcadia-finance/plugin-elizaos

ElizaOS plugin for [Arcadia Finance](https://arcadia.finance) on Base.

Deploy and manage concentrated liquidity positions on Uniswap and Aerodrome with automated rebalancing, compounding, and yield optimization.

- **Website**: https://arcadia.finance
- **Docs**: https://docs.arcadia.finance
- **Supported chains**: Base (8453)

## Installation

```bash
elizaos plugins add @arcadia-finance/plugin-elizaos
```

## Configuration

Requires `@elizaos/plugin-evm` loaded with `EVM_PRIVATE_KEY` set in your agent configuration.

## Features

### Providers (17)

- Wallet accounts, balances, allowances, points
- Account info, history, PnL
- Lending pool list and details
- Strategy list, info, and recommendations
- Asset list and prices
- Asset manager intents
- Points leaderboard
- Guides

### Actions (20)

- **Account management**: create account, deposit, withdraw
- **Lending**: borrow, repay, approve
- **LP positions**: add liquidity, close position, swap, deleverage, remove liquidity, stake/unstake/claim
- **Automations**: set asset managers, encode rebalancer, compounder, compounder staked, yield claimer, yield claimer cowswap, cow swapper, merkl operator

## Common Prompts

### Account Management

- "Create a new Arcadia margin account on Base"
- "Show all my Arcadia accounts"
- "What is the health factor of my Arcadia account?"
- "Show the positions and collateral in my Arcadia account"

### Deposits and Withdrawals

- "Deposit 1000 USDC into my Arcadia account"
- "Withdraw 0.5 WETH from my Arcadia account"
- "Approve USDC for my Arcadia account"

### Lending

- "Show available lending pools on Arcadia"
- "What is the APY for the USDC lending pool?"
- "Borrow 500 USDC from the USDC pool against my account"
- "Repay 500 USDC to the lending pool"

### Liquidity Positions

- "Show featured LP strategies on Arcadia"
- "Open a WETH/USDC LP position with 1000 USDC"
- "Open a 2x leveraged WETH/AERO position with 0.5 WETH"
- "Close my LP position and receive everything in USDC"
- "Remove half the liquidity from my LP position"
- "Swap WETH to USDC inside my Arcadia account"

### Automations

- "Enable the rebalancer on my Slipstream LP position"
- "Enable the compounder to auto-compound my LP fees"
- "Set up yield claiming with CowSwap to sell AERO rewards for USDC"
- "Enable the Merkl operator to claim incentive rewards"
- "Stake my LP position for AERO rewards"
- "Claim staking rewards for my position"

### Portfolio Overview

- "Show my account value history over the last 30 days"
- "What is the PnL on my Arcadia account?"
- "Show the points leaderboard"
- "How many Arcadia points do I have?"
- "What are the current prices of WETH and USDC?"

## Development

```bash
bun install
bun run build
bun run test
bun run typecheck
```

## License

MIT
