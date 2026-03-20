import type { Provider } from "@elizaos/core";
import { walletAccountsProvider } from "./walletAccounts";
import { accountInfoProvider } from "./accountInfo";
import { accountHistoryProvider } from "./accountHistory";
import { accountPnlProvider } from "./accountPnl";
import { poolListProvider } from "./poolList";
import { poolInfoProvider } from "./poolInfo";
import { strategyListProvider } from "./strategyList";
import { strategyInfoProvider } from "./strategyInfo";
import { strategyRecommendationProvider } from "./strategyRecommendation";
import { walletBalancesProvider } from "./walletBalances";
import { walletAllowancesProvider } from "./walletAllowances";
import { walletPointsProvider } from "./walletPoints";
import { assetListProvider } from "./assetList";
import { assetPricesProvider } from "./assetPrices";
import { assetManagerIntentsProvider } from "./assetManagerIntents";
import { pointLeaderboardProvider } from "./pointLeaderboard";
import { guidesProvider } from "./guides";

export const providers: Provider[] = [
  walletAccountsProvider,
  accountInfoProvider,
  accountHistoryProvider,
  accountPnlProvider,
  poolListProvider,
  poolInfoProvider,
  strategyListProvider,
  strategyInfoProvider,
  strategyRecommendationProvider,
  walletBalancesProvider,
  walletAllowancesProvider,
  walletPointsProvider,
  assetListProvider,
  assetPricesProvider,
  assetManagerIntentsProvider,
  pointLeaderboardProvider,
  guidesProvider,
];
