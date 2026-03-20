import type {
  Action,
  ActionResult,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { ModelType, parseKeyValueXml, composePromptFromState } from "@elizaos/core";
import { encodeYieldClaimerTemplate } from "../templates";
import { getAmAddress, type DexProtocol } from "../shared/addresses";
import {
  CLAIMER_INITIATOR,
  encodeYieldClaimerCallbackData,
} from "../shared/encoding";

export const encodeYieldClaimerAction: Action = {
  name: "ARCADIA_ENCODE_YIELD_CLAIMER",
  description:
    "Encode yield claimer asset manager parameters for an Arcadia account.",
  similes: [
    "encode yield claimer",
    "yield claimer config",
    "claim yield config",
    "auto claim yield",
  ],
  examples: [
    [
      {
        name: "user",
        content: { text: "Encode the yield claimer for my LP position" },
      },
      {
        name: "assistant",
        content: {
          text: "Encoding yield claimer parameters.",
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
      const context = composePromptFromState({ state, template: encodeYieldClaimerTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const dexProtocol = (params.dexProtocol as string) || "slipstream";
      const enabled = (params.enabled as string)?.toLowerCase() !== "false";

      const amAddress = getAmAddress(
        "yieldClaimers",
        dexProtocol as DexProtocol,
      );

      if (!enabled) {
        const result = JSON.stringify({
          description: `Disable yield_claimer (${dexProtocol})`,
          asset_managers: [amAddress],
          statuses: [false],
          datas: ["0x"],
        });
        if (callback) callback({ text: result });
        return { success: true, text: result };
      }

      const feeRecipient = params.feeRecipient as string;
      if (!feeRecipient) {
        throw new Error("Missing required parameter: feeRecipient");
      }

      const callbackData = encodeYieldClaimerCallbackData(
        CLAIMER_INITIATOR,
        feeRecipient as `0x${string}`,
      );

      const result = JSON.stringify({
        description: `Enable yield_claimer (${dexProtocol})`,
        asset_managers: [amAddress],
        statuses: [true],
        datas: [callbackData],
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
