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
import { createAccountTemplate } from "../templates";
import { factoryAbi } from "../shared/abis";
import { FACTORY_ADDRESS } from "../shared/constants";

export const createAccountAction: Action = {
  name: "ARCADIA_CREATE_ACCOUNT",
  description:
    "Create a new Arcadia Finance account (spot or margin) on Base.",
  similes: [
    "create arcadia account",
    "open arcadia account",
    "new arcadia account",
    "create margin account",
    "create spot account",
  ],
  examples: [
    [
      {
        name: "user",
        content: { text: "Create a new Arcadia margin account on Base" },
      },
      {
        name: "assistant",
        content: { text: "Creating a new margin Arcadia account on Base." },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!text.includes("create") && !text.includes("open") && !text.includes("new")) return false;
    if (!text.includes("account") && !text.includes("arcadia")) return false;
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

      if (!state) state = (await runtime.composeState(message)) as State;
      state = await runtime.composeState(message, ["RECENT_MESSAGES"], true);
      const context = composePromptFromState({ state, template: createAccountTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const creditor = (params.creditor as string) || "0x0000000000000000000000000000000000000000";

      const latestVersion = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "latestAccountVersion",
      });

      const salt = Math.floor(Math.random() * 2 ** 32);

      const data = encodeFunctionData({
        abi: factoryAbi,
        functionName: "createAccount",
        args: [salt, BigInt(latestVersion), creditor as `0x${string}`],
      });

      const hash = await walletClient.sendTransaction({
        to: FACTORY_ADDRESS,
        data,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `Arcadia account created. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
