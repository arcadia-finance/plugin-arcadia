import type {
  Action,
  ActionResult,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { ModelType, parseKeyValueXml, composePromptFromState } from "@elizaos/core";
import { encodeRebalancerTemplate } from "../templates";
import { getAmAddress, type DexProtocol } from "../shared/addresses";
import {
  REBALANCER_INITIATOR,
  MINIMAL_STRATEGY_HOOK,
  encodeRebalancerMetadata,
  encodeRebalancerCallbackData,
} from "../shared/encoding";

export const encodeRebalancerAction: Action = {
  name: "ARCADIA_ENCODE_REBALANCER",
  description:
    "Encode rebalancer asset manager parameters for an Arcadia account.",
  similes: [
    "encode rebalancer",
    "rebalancer config",
    "rebalancer parameters",
    "set up rebalancer",
  ],
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Encode the rebalancer for my Slipstream LP position",
        },
      },
      {
        name: "assistant",
        content: {
          text: "Encoding rebalancer parameters for Slipstream.",
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
      const context = composePromptFromState({ state, template: encodeRebalancerTemplate });
      const xml = await runtime.useModel(ModelType.TEXT_SMALL, { prompt: context });
      const params = parseKeyValueXml(xml as string) ?? {};

      const dexProtocol = (params.dexProtocol as string) || "slipstream";
      const enabled = (params.enabled as string)?.toLowerCase() !== "false";

      const amAddress = getAmAddress("rebalancers", dexProtocol as DexProtocol);

      if (!enabled) {
        const result = JSON.stringify({
          description: `Disable rebalancer (${dexProtocol})`,
          asset_managers: [amAddress],
          statuses: [false],
          datas: ["0x"],
        });
        if (callback) callback({ text: result });
        return { success: true, text: result };
      }

      const metaData = encodeRebalancerMetadata({
        compoundLeftovers: "all",
        optimalToken0Ratio: 500000,
        triggerLowerRatio: 0,
        triggerUpperRatio: 0,
        minRebalanceTime: 3600,
        maxRebalanceTime: 1e12,
      });

      const callbackData = encodeRebalancerCallbackData(
        REBALANCER_INITIATOR,
        MINIMAL_STRATEGY_HOOK,
        metaData,
      );

      const result = JSON.stringify({
        description: `Enable rebalancer (default strategy, ${dexProtocol})`,
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
