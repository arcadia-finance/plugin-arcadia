import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { apiGet } from "../shared/api";
import type { LeaderboardEntry } from "../types";

const KEYWORDS = ["leaderboard", "ranking", "top points"];

export const pointLeaderboardProvider: Provider = {
  name: "ARCADIA_POINT_LEADERBOARD",
  description: "Returns the Arcadia points leaderboard.",
  dynamic: true,
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<ProviderResult> => {
    const text = message?.content?.text?.toLowerCase() ?? "";
    if (!KEYWORDS.some((k) => text.includes(k))) {
      return { text: "" };
    }

    try {
      const data = await apiGet<LeaderboardEntry[]>("/points/leaderboard");

      if (!data || data.length === 0) {
        return { text: "No leaderboard data available." };
      }

      const top = data.slice(0, 20);
      const lines = top.map(
        (e, i) => `  #${i + 1} ${e.user_address}: ${e.total_points} pts`,
      );

      return {
        text: `Arcadia Points Leaderboard (top ${top.length}):\n${lines.join("\n")}`,
      };
    } catch (error) {
      return { text: "" };
    }
  },
};
