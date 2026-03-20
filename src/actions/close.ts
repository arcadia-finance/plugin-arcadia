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
import { closeTemplate } from "../templates";
import { ERC8021_SUFFIX } from "../shared/constants";
import { apiGet, apiPost } from "../shared/api";
import type { AccountSummary, AccountOverview, BundleResponse } from "../types";

export const closeAction: Action = {
  name: "ARCADIA_CLOSE",
  description:
    "Close all positions in an Arcadia account, repay debt, and receive a specific token.",
  similes: [
    "close arcadia position",
    "close arcadia account",
    "exit position arcadia",
    "wind down arcadia",
  ],
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Close my LP position and receive everything in USDC",
        },
      },
      {
        name: "assistant",
        content: {
          text: "Closing your Arcadia position and converting to USDC.",
        },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!text.includes("close") && !text.includes("exit") && !text.includes("wind down"))
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

      if (!state) state = (await runtime.composeState(message)) as State;
      state = await runtime.composeState(message, ["RECENT_MESSAGES"], true);
      const context = composePromptFromState({ state, template: closeTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const accountAddress = params.accountAddress as string;
      const receiveTokenAddress = params.receiveTokenAddress as string;

      if (!accountAddress || !receiveTokenAddress) {
        throw new Error("Missing required parameters: accountAddress, receiveTokenAddress");
      }

      const overview = await apiGet<AccountOverview>("/accounts/overview", {
        chain_id: 8453,
        account: accountAddress,
      });

      if (!overview.assets || overview.assets.length === 0) {
        throw new Error("Account has no assets to close.");
      }

      const accountData = await apiGet<{ accounts: AccountSummary[] }>(
        "/accounts",
        { chain_id: 8453, owner: overview.owner },
      );
      const accountStub = accountData.accounts.find(
        (a) =>
          a.account_address.toLowerCase() === accountAddress.toLowerCase(),
      );
      if (!accountStub) throw new Error(`Account ${accountAddress} not found`);

      const creditor =
        overview.creditor || "0x0000000000000000000000000000000000000000";

      const allAssets = await apiGet<Array<{ address: string; decimals: number }>>(
        "/assets",
        { chain_id: 8453 },
      );
      const decimalsMap = new Map(
        allAssets.map((a) => [a.address.toLowerCase(), a.decimals]),
      );

      const numeraireDecimals =
        decimalsMap.get(accountStub.numeraire.toLowerCase()) ?? 18;
      const receiveDecimals =
        decimalsMap.get(receiveTokenAddress.toLowerCase()) ?? 18;

      const sell = overview.assets.map((a) => ({
        asset_address: a.address,
        amount: String(a.amount),
        decimals: decimalsMap.get(a.address.toLowerCase()) ?? 1,
        asset_id: a.id || 0,
      }));

      const body = {
        buy: [
          {
            asset_address: receiveTokenAddress,
            distribution: 1,
            decimals: receiveDecimals,
            strategy_id: 0,
          },
        ],
        sell,
        deposits: { addresses: [], ids: [], amounts: [], decimals: [] },
        withdraws: { addresses: [], ids: [], amounts: [], decimals: [] },
        wallet_address: overview.owner,
        account_address: accountAddress,
        numeraire: accountStub.numeraire,
        numeraire_decimals: numeraireDecimals,
        debt: { take: false, leverage: 0, repay: -1, creditor },
        chain_id: 8453,
        version: accountStub.creation_version,
        action_type: "account.closing-position",
        slippage: 100,
      };

      const result = await apiPost<BundleResponse>("/bundles/calldata", body);

      if (result.tenderly_sim_status === "false") {
        throw new Error("Transaction simulation failed. Try closing LP first, then swap and repay separately.");
      }

      const calldata = (result.calldata + ERC8021_SUFFIX) as `0x${string}`;

      const hash = await walletClient.sendTransaction({
        to: result.fx_call_to as `0x${string}`,
        data: calldata,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `Position closed on ${accountAddress}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
