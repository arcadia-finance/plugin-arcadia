import type {
  Action,
  ActionResult,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { ModelType, parseKeyValueXml, composePromptFromState } from "@elizaos/core";
import { encodeMerklOperatorTemplate } from "../templates";
import { STANDALONE_AM } from "../shared/addresses";
import {
  MERKL_INITIATOR,
  encodeMerklOperatorCallbackData,
} from "../shared/encoding";

export const encodeMerklOperatorAction: Action = {
  name: "ARCADIA_ENCODE_MERKL_OPERATOR",
  description:
    "Encode Merkl operator asset manager parameters for an Arcadia account.",
  similes: [
    "encode merkl operator",
    "merkl config",
    "merkl rewards config",
    "enable merkl",
  ],
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Enable the Merkl operator to claim incentive rewards",
        },
      },
      {
        name: "assistant",
        content: { text: "Encoding Merkl operator parameters." },
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
      const context = composePromptFromState({ state, template: encodeMerklOperatorTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const enabled = (params.enabled as string)?.toLowerCase() !== "false";
      const amAddress = STANDALONE_AM.merklOperator;

      if (!enabled) {
        const result = JSON.stringify({
          description: "Disable merkl_operator",
          asset_managers: [amAddress],
          statuses: [false],
          datas: ["0x"],
        });
        if (callback) callback({ text: result });
        return { success: true, text: result };
      }

      const rewardRecipient = params.rewardRecipient as string;
      if (!rewardRecipient) {
        throw new Error("Missing required parameter: rewardRecipient");
      }

      const callbackData = encodeMerklOperatorCallbackData(
        MERKL_INITIATOR,
        rewardRecipient as `0x${string}`,
      );

      const result = JSON.stringify({
        description: "Enable merkl_operator",
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
