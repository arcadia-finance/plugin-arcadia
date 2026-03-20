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
import { depositTemplate } from "../templates";
import { accountAbi, erc20Abi } from "../shared/abis";

export const depositAction: Action = {
  name: "ARCADIA_DEPOSIT",
  description:
    "Deposit tokens from your wallet into an Arcadia account.",
  similes: [
    "deposit into arcadia",
    "deposit tokens arcadia",
    "fund arcadia account",
    "add collateral arcadia",
  ],
  examples: [
    [
      {
        name: "user",
        content: { text: "Deposit 1000 USDC into my Arcadia account" },
      },
      {
        name: "assistant",
        content: { text: "Depositing 1000 USDC into your Arcadia account." },
      },
    ],
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!text.includes("deposit")) return false;
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
      const context = composePromptFromState({ state, template: depositTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const accountAddress = params.accountAddress as string;
      const tokenAddress = params.tokenAddress as string;
      const amount = params.amount as string;

      if (!accountAddress || !tokenAddress || !amount) {
        throw new Error("Missing required parameters: accountAddress, tokenAddress, amount");
      }

      const decimals = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
      });
      const amountWei = parseUnits(amount, decimals);
      if (amountWei === 0n) throw new Error("Amount must be greater than 0");

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

      const depositData = encodeFunctionData({
        abi: accountAbi,
        functionName: "deposit",
        args: [[tokenAddress as `0x${string}`], [0n], [amountWei]],
      });

      const hash = await walletClient.sendTransaction({
        to: accountAddress as `0x${string}`,
        data: depositData,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      const msg = `Deposited ${amount} tokens into ${accountAddress}. Tx: ${hash}`;
      if (callback) callback({ text: msg });
      return { success: true, text: msg, data: { hash } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
