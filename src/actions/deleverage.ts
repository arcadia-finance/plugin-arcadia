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
import { deleverageTemplate } from "../templates";
import { accountAbi, erc20Abi } from "../shared/abis";
import { ERC8021_SUFFIX } from "../shared/constants";
import { apiGet } from "../shared/api";
import type { BundleResponse } from "../types";

export const deleverageAction: Action = {
  name: "ARCADIA_DELEVERAGE",
  description:
    "Deleverage an Arcadia account by selling collateral to repay debt.",
  similes: [
    "deleverage arcadia",
    "reduce leverage arcadia",
    "sell collateral repay arcadia",
    "decrease exposure arcadia",
  ],
  examples: [
    [
      {
        name: "user",
        content: { text: "Deleverage my Arcadia account by selling 0.5 WETH" },
      },
      {
        name: "assistant",
        content: { text: "Deleveraging your account by selling 0.5 WETH." },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!text.includes("deleverage") && !text.includes("reduce leverage"))
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
      const context = composePromptFromState({ state, template: deleverageTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const accountAddress = params.accountAddress as string;
      const tokenFrom = params.tokenFrom as string;
      const amount = params.amount as string;

      if (!accountAddress || !tokenFrom || !amount) {
        throw new Error("Missing required parameters: accountAddress, tokenFrom, amount");
      }

      const [creditor, numeraire] = await Promise.all([
        publicClient.readContract({
          address: accountAddress as `0x${string}`,
          abi: accountAbi,
          functionName: "creditor",
        }),
        publicClient.readContract({
          address: accountAddress as `0x${string}`,
          abi: accountAbi,
          functionName: "numeraire",
        }),
      ]);

      if (
        !creditor ||
        creditor === "0x0000000000000000000000000000000000000000"
      ) {
        throw new Error("This is a spot account with no debt. Deleverage is not applicable.");
      }

      const decimals = await publicClient.readContract({
        address: tokenFrom as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
      });
      const amountWei = parseUnits(amount, decimals);
      if (amountWei === 0n) throw new Error("Amount must be greater than 0");

      const result = await apiGet<BundleResponse>("/bundles/repay_calldata", {
        amount_in: amountWei.toString(),
        chain_id: 8453,
        account_address: accountAddress,
        asset_from: tokenFrom,
        numeraire: numeraire as string,
        creditor: creditor as string,
        slippage: 100,
      });

      if (result.tenderly_sim_status === "false") {
        throw new Error("Deleverage simulation failed. Verify the account holds enough collateral.");
      }

      const calldata = (result.calldata + ERC8021_SUFFIX) as `0x${string}`;

      const hash = await walletClient.sendTransaction({
        to: result.fx_call_to as `0x${string}`,
        data: calldata,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `Deleveraged ${amount} from ${accountAddress}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
