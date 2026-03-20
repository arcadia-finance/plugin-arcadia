import type {
  Action,
  ActionResult,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { ModelType, parseKeyValueXml, composePromptFromState } from "@elizaos/core";
import { initWallet } from "../shared/wallet";
import { encodeFunctionData, parseUnits } from "viem";
import { addLiquidityTemplate } from "../templates";
import { erc20Abi } from "../shared/abis";
import { ERC8021_SUFFIX } from "../shared/constants";
import { apiGet, apiPost } from "../shared/api";
import type { AccountSummary, Strategy, BundleResponse } from "../types";

export const addLiquidityAction: Action = {
  name: "ARCADIA_ADD_LIQUIDITY",
  description:
    "Open a concentrated liquidity position on Arcadia via a strategy, with optional leverage.",
  similes: [
    "add liquidity arcadia",
    "open lp position arcadia",
    "provide liquidity arcadia",
    "open position arcadia",
    "lp arcadia",
  ],
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Open a WETH/USDC LP position with 1000 USDC on Arcadia",
        },
      },
      {
        name: "assistant",
        content: { text: "Opening an LP position with 1000 USDC on Arcadia." },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (
      !text.includes("liquidity") &&
      !text.includes("lp") &&
      !text.includes("position") &&
      !text.includes("open")
    )
      return false;
    const pk = runtime.getSetting("EVM_PRIVATE_KEY");
    return typeof pk === "string" && pk.startsWith("0x");
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    _options: unknown,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    try {
      const walletProvider = await initWallet(runtime);
      const walletClient = walletProvider.getWalletClient("base");
      const publicClient = walletProvider.getPublicClient("base");
      const wallet = walletProvider.getAddress();

      if (!state) state = (await runtime.composeState(message)) as State;
      state = await runtime.composeState(message, ["RECENT_MESSAGES"], true);
      const context = composePromptFromState({ state, template: addLiquidityTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const accountAddress = params.accountAddress as string;
      const strategyId = parseInt(params.strategyId as string, 10);
      const tokenAddress = params.tokenAddress as string;
      const amount = params.amount as string;
      const leverage = parseFloat(params.leverage as string) || 0;

      if (!accountAddress || !tokenAddress || !amount || isNaN(strategyId)) {
        throw new Error("Missing required parameters: accountAddress, strategyId, tokenAddress, amount");
      }

      const decimals = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
      });
      const amountWei = parseUnits(amount, decimals);
      if (amountWei === 0n) throw new Error("Amount must be greater than 0");

      const accountData = await apiGet<{ accounts: AccountSummary[] }>(
        "/accounts",
        { chain_id: 8453, owner: wallet },
      );
      const accountStub = accountData.accounts.find(
        (a) =>
          a.account_address.toLowerCase() === accountAddress.toLowerCase(),
      );
      if (!accountStub) throw new Error(`Account ${accountAddress} not found for wallet ${wallet}`);

      const strategies = await apiGet<Strategy[]>("/strategies", {
        chain_id: 8453,
      });
      const strategy = strategies.find((s) => s.strategy_id === strategyId);
      if (!strategy) throw new Error(`Strategy ${strategyId} not found`);

      const overview = await apiGet<{ creditor: string }>(
        "/accounts/overview",
        { chain_id: 8453, account: accountAddress },
      );
      const creditor =
        overview.creditor || "0x0000000000000000000000000000000000000000";
      const isSpot =
        creditor === "0x0000000000000000000000000000000000000000";

      if (isSpot && leverage > 0)
        throw new Error("Spot accounts cannot use leverage. Set leverage to 0.");

      const assets = await apiGet<Array<{ address: string; decimals: number }>>(
        "/assets",
        { chain_id: 8453 },
      );
      const numeraireAsset = assets.find(
        (a) =>
          a.address.toLowerCase() === accountStub.numeraire.toLowerCase(),
      );
      const numeraireDecimals = numeraireAsset?.decimals ?? 18;

      const body = {
        buy: [
          {
            asset_address: strategy.asset_address,
            distribution: 1,
            decimals: strategy.asset_decimals,
            strategy_id: strategyId,
          },
        ],
        sell: [],
        deposits: {
          addresses: [tokenAddress],
          ids: [0],
          amounts: [amountWei.toString()],
          decimals: [decimals],
        },
        withdraws: { addresses: [], ids: [], amounts: [], decimals: [] },
        wallet_address: wallet,
        account_address: accountAddress,
        numeraire: accountStub.numeraire,
        numeraire_decimals: numeraireDecimals,
        debt: {
          take: !isSpot && leverage > 0,
          leverage: isSpot ? 1 : leverage,
          repay: 0,
          creditor,
        },
        chain_id: 8453,
        version: accountStub.creation_version,
        action_type: "portfolio.advanced",
        slippage: 100,
      };

      const result = await apiPost<BundleResponse>("/bundles/calldata", body);

      if (result.tenderly_sim_status === "false") {
        throw new Error("Transaction simulation failed. Check balances and approvals.");
      }

      // Check allowance and approve if needed
      const currentAllowance = (await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [wallet as `0x${string}`, accountAddress as `0x${string}`],
      })) as bigint;

      if (currentAllowance < amountWei) {
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [accountAddress as `0x${string}`, amountWei],
        });
        await walletClient.sendTransaction({
          to: tokenAddress as `0x${string}`,
          data: approveData,
          chain: walletClient.chain,
          account: walletClient.account!,
        });
      }

      const calldata = (result.calldata + ERC8021_SUFFIX) as `0x${string}`;

      const hash = await walletClient.sendTransaction({
        to: result.fx_call_to as `0x${string}`,
        data: calldata,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `LP position opened on strategy #${strategyId}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
