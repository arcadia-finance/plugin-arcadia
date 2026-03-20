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
import { parseUnits } from "viem";
import { swapTemplate } from "../templates";
import { erc20Abi } from "../shared/abis";
import { ERC8021_SUFFIX } from "../shared/constants";
import { apiGet } from "../shared/api";
import type { BundleResponse } from "../types";

export const swapAction: Action = {
  name: "ARCADIA_SWAP",
  description: "Swap tokens inside an Arcadia account.",
  similes: [
    "swap tokens arcadia",
    "swap inside arcadia",
    "exchange tokens arcadia",
    "convert tokens arcadia",
  ],
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Swap WETH to USDC inside my Arcadia account",
        },
      },
      {
        name: "assistant",
        content: { text: "Swapping WETH to USDC inside your Arcadia account." },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!text.includes("swap") && !text.includes("exchange") && !text.includes("convert"))
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

      if (!state) state = (await runtime.composeState(message)) as State;
      state = await runtime.composeState(message, ["RECENT_MESSAGES"], true);
      const context = composePromptFromState({ state, template: swapTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const accountAddress = params.accountAddress as string;
      const tokenFrom = params.tokenFrom as string;
      const tokenTo = params.tokenTo as string;
      const amount = params.amount as string;

      if (!accountAddress || !tokenFrom || !tokenTo || !amount) {
        throw new Error("Missing required parameters: accountAddress, tokenFrom, tokenTo, amount");
      }

      const decimals = await publicClient.readContract({
        address: tokenFrom as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
      });
      const amountWei = parseUnits(amount, decimals);
      if (amountWei === 0n) throw new Error("Amount must be greater than 0");

      const result = await apiGet<BundleResponse>("/bundles/swap_calldata", {
        amount_in: amountWei.toString(),
        chain_id: 8453,
        account_address: accountAddress,
        asset_from: tokenFrom,
        asset_to: tokenTo,
        slippage: 100,
      });

      if (result.tenderly_sim_status === "false") {
        throw new Error("Swap simulation failed. Verify the account holds enough of the source token.");
      }

      const calldata = (result.calldata + ERC8021_SUFFIX) as `0x${string}`;

      const hash = await walletClient.sendTransaction({
        to: result.fx_call_to as `0x${string}`,
        data: calldata,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `Swapped ${amount} tokens in ${accountAddress}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
