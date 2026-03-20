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
import { removeLiquidityTemplate } from "../templates";
import { ERC8021_SUFFIX } from "../shared/constants";
import { apiGet } from "../shared/api";
import type { BundleResponse } from "../types";

export const removeLiquidityAction: Action = {
  name: "ARCADIA_REMOVE_LIQUIDITY",
  description:
    "Remove liquidity from a concentrated LP position in an Arcadia account.",
  similes: [
    "remove liquidity arcadia",
    "decrease liquidity arcadia",
    "pull liquidity arcadia",
    "reduce lp arcadia",
  ],
  examples: [
    [
      {
        name: "user",
        content: { text: "Remove half the liquidity from my LP position" },
      },
      {
        name: "assistant",
        content: {
          text: "Removing 50% of your LP position liquidity.",
        },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!text.includes("remove") && !text.includes("decrease") && !text.includes("reduce"))
      return false;
    if (!text.includes("liquidity") && !text.includes("lp")) return false;
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
      const context = composePromptFromState({ state, template: removeLiquidityTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const accountAddress = params.accountAddress as string;
      const assetAddress = params.assetAddress as string;
      const assetId = parseInt(params.assetId as string, 10);
      const adjustment = params.adjustment as string;

      if (!accountAddress || !assetAddress || isNaN(assetId) || !adjustment) {
        throw new Error("Missing required parameters: accountAddress, assetAddress, assetId, adjustment");
      }

      const result = await apiGet<BundleResponse>(
        "/bundles/decrease_liquidity",
        {
          chain_id: 8453,
          account_address: accountAddress,
          asset: assetAddress,
          position_id: assetId,
          adjustment,
        },
      );

      if (result.tenderly_sim_status === "false") {
        throw new Error("Transaction simulation failed. Verify the position exists with account info.");
      }

      const calldata = (result.calldata + ERC8021_SUFFIX) as `0x${string}`;

      const hash = await walletClient.sendTransaction({
        to: result.fx_call_to as `0x${string}`,
        data: calldata,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `Removed liquidity from position #${assetId}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
