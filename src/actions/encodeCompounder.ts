import type {
  Action,
  ActionResult,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { ModelType, parseKeyValueXml, composePromptFromState } from "@elizaos/core";
import { encodeCompounderTemplate } from "../templates";
import { getAmAddress, type DexProtocol } from "../shared/addresses";
import {
  COMPOUNDER_INITIATOR,
  encodeCompounderCallbackData,
} from "../shared/encoding";

export const encodeCompounderAction: Action = {
  name: "ARCADIA_ENCODE_COMPOUNDER",
  description:
    "Encode compounder asset manager parameters for an Arcadia account.",
  similes: [
    "encode compounder",
    "compounder config",
    "compounder parameters",
    "auto compound",
  ],
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Encode the compounder for my Slipstream LP position",
        },
      },
      {
        name: "assistant",
        content: {
          text: "Encoding compounder parameters for Slipstream.",
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
      const context = composePromptFromState({ state, template: encodeCompounderTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const dexProtocol = (params.dexProtocol as string) || "slipstream";
      const enabled = (params.enabled as string)?.toLowerCase() !== "false";

      const amAddress = getAmAddress("compounders", dexProtocol as DexProtocol);

      if (!enabled) {
        const result = JSON.stringify({
          description: `Disable compounder (${dexProtocol})`,
          asset_managers: [amAddress],
          statuses: [false],
          datas: ["0x"],
        });
        if (callback) callback({ text: result });
        return { success: true, text: result };
      }

      const callbackData = encodeCompounderCallbackData(COMPOUNDER_INITIATOR);

      const result = JSON.stringify({
        description: `Enable compounder (${dexProtocol})`,
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
