import type {
  Action,
  ActionResult,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { ModelType, parseKeyValueXml, composePromptFromState } from "@elizaos/core";
import { encodeYieldClaimerCowswapTemplate } from "../templates";
import { getAmAddress, STANDALONE_AM, type DexProtocol } from "../shared/addresses";
import {
  COWSWAPPER_INITIATOR,
  encodeCowSwapTokenMetadata,
  encodeYieldClaimerCoupledCallbackData,
} from "../shared/encoding";

export const encodeYieldClaimerCowswapAction: Action = {
  name: "ARCADIA_ENCODE_YIELD_CLAIMER_COWSWAP",
  description:
    "Encode yield claimer with CowSwap asset manager parameters for an Arcadia account.",
  similes: [
    "encode yield claimer cowswap",
    "yield claim cowswap config",
    "claim yield cowswap",
    "yield claimer swap",
  ],
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Set up yield claiming with CowSwap to sell AERO rewards for USDC",
        },
      },
      {
        name: "assistant",
        content: {
          text: "Encoding yield claimer CowSwap parameters.",
        },
      },
    ],
  ],
  validate: async (): Promise<boolean> => true,
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    _options: unknown,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    try {
      if (!state) state = (await runtime.composeState(message)) as State;
      state = await runtime.composeState(message, ["RECENT_MESSAGES"], true);
      const context = composePromptFromState({ state, template: encodeYieldClaimerCowswapTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const dexProtocol = (params.dexProtocol as string) || "slipstream";
      const enabled = (params.enabled as string)?.toLowerCase() !== "false";

      const cowSwapperAddress = STANDALONE_AM.cowSwapper;
      const yieldClaimerAddress = getAmAddress(
        "yieldClaimers",
        dexProtocol as DexProtocol,
      );

      if (!enabled) {
        const result = JSON.stringify({
          description: `Disable yield_claimer_cowswap (${dexProtocol})`,
          asset_managers: [cowSwapperAddress, yieldClaimerAddress],
          statuses: [false, false],
          datas: ["0x", "0x"],
        });
        if (callback) callback({ text: result });
        return { success: true, text: result };
      }

      const sellTokensStr = (params.sellTokens as string) || "";
      const buyToken = (params.buyToken as string) || "";
      const feeRecipient = params.feeRecipient as string;

      if (!sellTokensStr || !buyToken || !feeRecipient) {
        throw new Error("Missing required parameters: sellTokens, buyToken, feeRecipient");
      }

      const sellTokens = sellTokensStr
        .split(",")
        .map((s) => s.trim()) as `0x${string}`[];

      const cowSwapperData = encodeCowSwapTokenMetadata(
        "cow_swap_yield_claim",
        sellTokens,
        buyToken as `0x${string}`,
      );

      const yieldClaimerData = encodeYieldClaimerCoupledCallbackData(
        COWSWAPPER_INITIATOR,
        feeRecipient as `0x${string}`,
        "cow_swap_yield_claim",
      );

      const result = JSON.stringify({
        description: `Enable yield_claimer_cowswap (${dexProtocol}, cowswap)`,
        asset_managers: [cowSwapperAddress, yieldClaimerAddress],
        statuses: [true, true],
        datas: [cowSwapperData, yieldClaimerData],
      });

      if (callback) callback({ text: result });
      return { success: true, text: result };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (callback) callback({ text: `Error: ${msg}` });
      return { success: false, text: `Error: ${msg}` };
    }
  },
};
