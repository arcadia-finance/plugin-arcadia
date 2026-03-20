const TOKEN_LIST = `Available tokens: USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913), WETH (0x4200000000000000000000000000000000000006), cbBTC (0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf), AERO (0x940181a94A35A4569E4529A3CDfB74e38FD98631)`;

const POOL_LIST = `Available lending pools: wETH (0x803ea69c7e87D1d6C86adeB40CB636cC0E6B98E2), USDC (0x3ec4a293Fb906DD2Cd440c20dECB250DeF141dF1), cbBTC (0xa37E9b4369dc20940009030BfbC2088F09645e3B)`;

const DEX_PROTOCOLS = `DEX protocols: slipstream, slipstream_v2, staked_slipstream, staked_slipstream_v2, uniV3, uniV4`;

export const depositTemplate = `Extract the deposit parameters from the user's message.

Recent messages:
{{recentMessages}}

${TOKEN_LIST}

Respond in XML format:
<response>
  <accountAddress>Arcadia account address or empty</accountAddress>
  <tokenAddress>token contract address</tokenAddress>
  <amount>decimal amount like 100 or 0.5</amount>
</response>`;

export const withdrawTemplate = `Extract the withdrawal parameters from the user's message.

Recent messages:
{{recentMessages}}

${TOKEN_LIST}

Respond in XML format:
<response>
  <accountAddress>Arcadia account address</accountAddress>
  <tokenAddress>token contract address</tokenAddress>
  <amount>decimal amount like 100 or 0.5</amount>
</response>`;

export const borrowTemplate = `Extract the borrow parameters from the user's message.

Recent messages:
{{recentMessages}}

${POOL_LIST}

Respond in XML format:
<response>
  <accountAddress>Arcadia account address</accountAddress>
  <poolAddress>lending pool address</poolAddress>
  <amount>decimal amount like 500 or 0.1</amount>
</response>`;

export const repayTemplate = `Extract the repay parameters from the user's message.

Recent messages:
{{recentMessages}}

${POOL_LIST}

Respond in XML format:
<response>
  <accountAddress>Arcadia account address</accountAddress>
  <poolAddress>lending pool address</poolAddress>
  <amount>decimal amount like 500 or 0.1</amount>
</response>`;

export const approveTemplate = `Extract the token approval parameters from the user's message.

Recent messages:
{{recentMessages}}

${TOKEN_LIST}

Respond in XML format:
<response>
  <tokenAddress>token contract address</tokenAddress>
  <spender>spender address (usually an Arcadia account)</spender>
  <amount>decimal amount or "max" for unlimited approval</amount>
</response>`;

export const createAccountTemplate = `Extract the account creation parameters from the user's message.

Recent messages:
{{recentMessages}}

${POOL_LIST}

A creditor of 0x0000000000000000000000000000000000000000 creates a spot account (no borrowing).
A creditor set to a pool address creates a margin account linked to that pool.

Respond in XML format:
<response>
  <creditor>pool address for margin, or 0x0000000000000000000000000000000000000000 for spot</creditor>
</response>`;

export const addLiquidityTemplate = `Extract the add liquidity parameters from the user's message.

Recent messages:
{{recentMessages}}

${TOKEN_LIST}

The user needs to specify: an Arcadia account, a strategy ID, a deposit token, an amount, and optionally leverage (0 for no leverage).

Respond in XML format:
<response>
  <accountAddress>Arcadia account address</accountAddress>
  <strategyId>numeric strategy ID</strategyId>
  <tokenAddress>deposit token contract address</tokenAddress>
  <amount>decimal amount like 1000 or 0.5</amount>
  <leverage>leverage multiplier (0 for spot, 2 for 2x, etc.)</leverage>
</response>`;

export const closeTemplate = `Extract the close position parameters from the user's message.

Recent messages:
{{recentMessages}}

${TOKEN_LIST}

The user wants to close all positions in an Arcadia account and receive a specific token.

Respond in XML format:
<response>
  <accountAddress>Arcadia account address</accountAddress>
  <receiveTokenAddress>token to receive after closing</receiveTokenAddress>
</response>`;

export const swapTemplate = `Extract the swap parameters from the user's message.

Recent messages:
{{recentMessages}}

${TOKEN_LIST}

This swaps tokens inside an Arcadia account (not a wallet swap).

Respond in XML format:
<response>
  <accountAddress>Arcadia account address</accountAddress>
  <tokenFrom>source token contract address</tokenFrom>
  <tokenTo>destination token contract address</tokenTo>
  <amount>decimal amount to swap</amount>
</response>`;

export const deleverageTemplate = `Extract the deleverage parameters from the user's message.

Recent messages:
{{recentMessages}}

${TOKEN_LIST}

Deleverage sells collateral inside the account to repay debt.

Respond in XML format:
<response>
  <accountAddress>Arcadia account address</accountAddress>
  <tokenFrom>collateral token to sell for repayment</tokenFrom>
  <amount>decimal amount to sell</amount>
</response>`;

export const removeLiquidityTemplate = `Extract the remove liquidity parameters from the user's message.

Recent messages:
{{recentMessages}}

The user wants to decrease an LP position. They need to specify the account, the LP asset address, the position ID (NFT ID), and an adjustment percentage (e.g. "50" for removing half, "100" for all).

Respond in XML format:
<response>
  <accountAddress>Arcadia account address</accountAddress>
  <assetAddress>LP position asset address</assetAddress>
  <assetId>position ID (NFT token ID)</assetId>
  <adjustment>percentage to remove (1-100)</adjustment>
</response>`;

export const stakeTemplate = `Extract the stake/unstake/claim parameters from the user's message.

Recent messages:
{{recentMessages}}

Actions: "stake" to stake, "unstake" to unstake, "claim" to claim rewards.

Respond in XML format:
<response>
  <accountAddress>Arcadia account address</accountAddress>
  <action>stake, unstake, or claim</action>
  <assetAddress>LP position asset address</assetAddress>
  <assetId>position ID (NFT token ID)</assetId>
</response>`;

export const setAssetManagersTemplate = `Extract the set asset managers parameters from the user's message.

Recent messages:
{{recentMessages}}

The user should have previously used an encode* action to get the asset manager addresses, statuses, and callback data. Extract the arrays from recent messages.

Respond in XML format:
<response>
  <accountAddress>Arcadia account address</accountAddress>
  <assetManagers>comma-separated list of asset manager addresses</assetManagers>
  <statuses>comma-separated list of true/false values</statuses>
  <datas>pipe-separated list of hex-encoded callback data</datas>
</response>`;

export const encodeRebalancerTemplate = `Extract the rebalancer encoding parameters from the user's message.

Recent messages:
{{recentMessages}}

${DEX_PROTOCOLS}

Respond in XML format:
<response>
  <dexProtocol>DEX protocol name</dexProtocol>
  <enabled>true to enable, false to disable</enabled>
</response>`;

export const encodeCompounderTemplate = `Extract the compounder encoding parameters from the user's message.

Recent messages:
{{recentMessages}}

${DEX_PROTOCOLS}

Respond in XML format:
<response>
  <dexProtocol>DEX protocol name</dexProtocol>
  <enabled>true to enable, false to disable</enabled>
</response>`;

export const encodeCompounderStakedTemplate = `Extract the staked compounder encoding parameters from the user's message.

Recent messages:
{{recentMessages}}

${DEX_PROTOCOLS}
${TOKEN_LIST}

For staked positions, CowSwap sells reward tokens and buys a target token.

Respond in XML format:
<response>
  <dexProtocol>DEX protocol name</dexProtocol>
  <sellTokens>comma-separated list of reward token addresses to sell</sellTokens>
  <buyToken>target token address to buy</buyToken>
  <enabled>true to enable, false to disable</enabled>
</response>`;

export const encodeYieldClaimerTemplate = `Extract the yield claimer encoding parameters from the user's message.

Recent messages:
{{recentMessages}}

${DEX_PROTOCOLS}

Respond in XML format:
<response>
  <dexProtocol>DEX protocol name</dexProtocol>
  <feeRecipient>address to receive claimed yield</feeRecipient>
  <enabled>true to enable, false to disable</enabled>
</response>`;

export const encodeYieldClaimerCowswapTemplate = `Extract the yield claimer (CowSwap) encoding parameters from the user's message.

Recent messages:
{{recentMessages}}

${DEX_PROTOCOLS}
${TOKEN_LIST}

Respond in XML format:
<response>
  <dexProtocol>DEX protocol name</dexProtocol>
  <sellTokens>comma-separated list of yield token addresses to sell</sellTokens>
  <buyToken>target token address to buy</buyToken>
  <feeRecipient>address to receive claimed yield</feeRecipient>
  <enabled>true to enable, false to disable</enabled>
</response>`;

export const encodeCowSwapperTemplate = `Extract the CowSwap swapper encoding parameters from the user's message.

Recent messages:
{{recentMessages}}

Respond in XML format:
<response>
  <enabled>true to enable, false to disable</enabled>
</response>`;

export const encodeMerklOperatorTemplate = `Extract the Merkl operator encoding parameters from the user's message.

Recent messages:
{{recentMessages}}

Respond in XML format:
<response>
  <rewardRecipient>address to receive Merkl rewards</rewardRecipient>
  <enabled>true to enable, false to disable</enabled>
</response>`;
