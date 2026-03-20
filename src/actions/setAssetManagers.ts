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
import { encodeFunctionData } from "viem";
import { setAssetManagersTemplate } from "../templates";
import { accountAbi } from "../shared/abis";
import { ERC8021_SUFFIX } from "../shared/constants";

export const setAssetManagersAction: Action = {
  name: "ARCADIA_SET_ASSET_MANAGERS",
  description:
    "Configure asset managers (automations) on an Arcadia account.",
  similes: [
    "set asset managers arcadia",
    "enable automation arcadia",
    "configure automation arcadia",
    "set up rebalancer",
    "set up compounder",
  ],
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Set the asset managers on my Arcadia account with the encoded data",
        },
      },
      {
        name: "assistant",
        content: { text: "Setting asset managers on your account." },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (
      !text.includes("set asset") &&
      !text.includes("enable") &&
      !text.includes("configure") &&
      !text.includes("automation")
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
      const context = composePromptFromState({ state, template: setAssetManagersTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const accountAddress = params.accountAddress as string;
      const assetManagersStr = params.assetManagers as string;
      const statusesStr = params.statuses as string;
      const datasStr = params.datas as string;

      if (!accountAddress || !assetManagersStr || !statusesStr || !datasStr) {
        throw new Error("Missing required parameters: accountAddress, assetManagers, statuses, datas");
      }

      const assetManagers = assetManagersStr
        .split(",")
        .map((s) => s.trim()) as `0x${string}`[];
      const statuses = statusesStr
        .split(",")
        .map((s) => s.trim().toLowerCase() === "true");
      const datas = datasStr
        .split("|")
        .map((s) => s.trim()) as `0x${string}`[];

      if (
        assetManagers.length !== statuses.length ||
        assetManagers.length !== datas.length
      ) {
        throw new Error(
          `Array lengths must match: assetManagers(${assetManagers.length}), statuses(${statuses.length}), datas(${datas.length})`,
        );
      }

      if (assetManagers.length === 0) {
        throw new Error("At least one asset manager must be provided");
      }

      const data = encodeFunctionData({
        abi: accountAbi,
        functionName: "setAssetManagers",
        args: [assetManagers, statuses, datas],
      });

      const calldata = (data + ERC8021_SUFFIX) as `0x${string}`;

      const hash = await walletClient.sendTransaction({
        to: accountAddress as `0x${string}`,
        data: calldata,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `Set ${assetManagers.length} asset manager(s) on ${accountAddress}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
