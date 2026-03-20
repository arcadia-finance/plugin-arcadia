import type {
  Action,
  ActionResult,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { ModelType, parseKeyValueXml, composePromptFromState } from "@elizaos/core";
import { encodeCompounderStakedTemplate } from "../templates";
import { getAmAddress, STANDALONE_AM, type DexProtocol } from "../shared/addresses";
import {
  COWSWAPPER_INITIATOR,
  encodeCowSwapTokenMetadata,
  encodeCompounderCoupledCallbackData,
} from "../shared/encoding";

export const encodeCompounderStakedAction: Action = {
  name: "ARCADIA_ENCODE_COMPOUNDER_STAKED",
  description:
    "Encode staked compounder asset manager parameters with CowSwap for an Arcadia account.",
  similes: [
    "encode staked compounder",
    "compounder staked config",
    "staked compound config",
    "auto compound staked",
  ],
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Encode the staked compounder for my Slipstream position",
        },
      },
      {
        name: "assistant",
        content: {
          text: "Encoding staked compounder parameters for Slipstream.",
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
      const context = composePromptFromState({ state, template: encodeCompounderStakedTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const dexProtocol = (params.dexProtocol as string) || "staked_slipstream";
      const enabled = (params.enabled as string)?.toLowerCase() !== "false";

      const cowSwapperAddress = STANDALONE_AM.cowSwapper;
      const compounderAddress = getAmAddress(
        "compounders",
        dexProtocol as DexProtocol,
      );

      if (!enabled) {
        const result = JSON.stringify({
          description: `Disable compounder_staked (${dexProtocol})`,
          asset_managers: [cowSwapperAddress, compounderAddress],
          statuses: [false, false],
          datas: ["0x", "0x"],
        });
        if (callback) callback({ text: result });
        return { success: true, text: result };
      }

      const sellTokensStr = (params.sellTokens as string) || "";
      const buyToken = (params.buyToken as string) || "";

      if (!sellTokensStr || !buyToken) {
        throw new Error("Missing required parameters: sellTokens, buyToken");
      }

      const sellTokens = sellTokensStr
        .split(",")
        .map((s) => s.trim()) as `0x${string}`[];

      const cowSwapperData = encodeCowSwapTokenMetadata(
        "cow_swap_compound",
        sellTokens,
        buyToken as `0x${string}`,
      );

      const compounderData = encodeCompounderCoupledCallbackData(
        COWSWAPPER_INITIATOR,
        "cow_swap_compound",
      );

      const result = JSON.stringify({
        description: `Enable compounder_staked (${dexProtocol}, cowswap)`,
        asset_managers: [cowSwapperAddress, compounderAddress],
        statuses: [true, true],
        datas: [cowSwapperData, compounderData],
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
