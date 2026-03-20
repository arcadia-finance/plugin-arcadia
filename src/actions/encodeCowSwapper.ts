import type {
  Action,
  ActionResult,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { ModelType, parseKeyValueXml, composePromptFromState } from "@elizaos/core";
import { encodeCowSwapperTemplate } from "../templates";
import { STANDALONE_AM } from "../shared/addresses";
import { encodeOuterMetadata } from "../shared/encoding";

export const encodeCowSwapperAction: Action = {
  name: "ARCADIA_ENCODE_COW_SWAPPER",
  description:
    "Encode CowSwap swapper asset manager parameters for an Arcadia account.",
  similes: [
    "encode cow swapper",
    "cowswap config",
    "enable cowswap",
    "cow swap setup",
  ],
  examples: [
    [
      {
        name: "user",
        content: { text: "Enable the CowSwap swapper on my account" },
      },
      {
        name: "assistant",
        content: { text: "Encoding CowSwap swapper parameters." },
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
      const context = composePromptFromState({ state, template: encodeCowSwapperTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const enabled = (params.enabled as string)?.toLowerCase() !== "false";

      const cowSwapperAddress = STANDALONE_AM.cowSwapper;

      if (!enabled) {
        const result = JSON.stringify({
          description: "Disable cow_swapper",
          asset_managers: [cowSwapperAddress],
          statuses: [false],
          datas: ["0x"],
        });
        if (callback) callback({ text: result });
        return { success: true, text: result };
      }

      const cowSwapperData = encodeOuterMetadata("cow_swap_direct", "0x");

      const result = JSON.stringify({
        description: "Enable cow_swapper (direct mode)",
        asset_managers: [cowSwapperAddress],
        statuses: [true],
        datas: [cowSwapperData],
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
