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
import { stakeTemplate } from "../templates";
import { ERC8021_SUFFIX } from "../shared/constants";
import { apiGet } from "../shared/api";
import type { BundleResponse } from "../types";

export const stakeAction: Action = {
  name: "ARCADIA_STAKE",
  description:
    "Stake, unstake, or claim rewards for an LP position in an Arcadia account.",
  similes: [
    "stake arcadia",
    "unstake arcadia",
    "claim rewards arcadia",
    "stake lp arcadia",
    "claim staking rewards",
  ],
  examples: [
    [
      {
        name: "user",
        content: { text: "Stake my LP position for AERO rewards" },
      },
      {
        name: "assistant",
        content: { text: "Staking your LP position for rewards." },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (
      !text.includes("stake") &&
      !text.includes("unstake") &&
      !text.includes("claim")
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

      if (!state) state = (await runtime.composeState(message)) as State;
      state = await runtime.composeState(message, ["RECENT_MESSAGES"], true);
      const context = composePromptFromState({ state, template: stakeTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const accountAddress = params.accountAddress as string;
      const action = params.action as string;
      const assetAddress = params.assetAddress as string;
      const assetId = parseInt(params.assetId as string, 10);

      if (!accountAddress || !action || !assetAddress || isNaN(assetId)) {
        throw new Error("Missing required parameters: accountAddress, action, assetAddress, assetId");
      }

      if (!["stake", "unstake", "claim"].includes(action)) {
        throw new Error(`Invalid action: ${action}. Must be stake, unstake, or claim.`);
      }

      const endpoint =
        action === "claim" ? "/bundles/claim" : "/bundles/stake";

      const result = await apiGet<BundleResponse>(endpoint, {
        chain_id: 8453,
        account_address: accountAddress,
        asset: assetAddress,
        position_id: assetId,
      });

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

      const labels: Record<string, string> = {
        stake: "Staked",
        unstake: "Unstaked",
        claim: "Claimed rewards for",
      };
      const msg = `${labels[action]} position #${assetId}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
