import type { Action } from "@elizaos/core";
import { createAccountAction } from "./createAccount";
import { depositAction } from "./deposit";
import { withdrawAction } from "./withdraw";
import { borrowAction } from "./borrow";
import { repayAction } from "./repay";
import { approveAction } from "./approve";
import { addLiquidityAction } from "./addLiquidity";
import { closeAction } from "./close";
import { swapAction } from "./swap";
import { deleverageAction } from "./deleverage";
import { removeLiquidityAction } from "./removeLiquidity";
import { stakeAction } from "./stake";
import { setAssetManagersAction } from "./setAssetManagers";
import { encodeRebalancerAction } from "./encodeRebalancer";
import { encodeCompounderAction } from "./encodeCompounder";
import { encodeCompounderStakedAction } from "./encodeCompounderStaked";
import { encodeYieldClaimerAction } from "./encodeYieldClaimer";
import { encodeYieldClaimerCowswapAction } from "./encodeYieldClaimerCowswap";
import { encodeCowSwapperAction } from "./encodeCowSwapper";
import { encodeMerklOperatorAction } from "./encodeMerklOperator";

export const actions: Action[] = [
  createAccountAction,
  depositAction,
  withdrawAction,
  borrowAction,
  repayAction,
  approveAction,
  addLiquidityAction,
  closeAction,
  swapAction,
  deleverageAction,
  removeLiquidityAction,
  stakeAction,
  setAssetManagersAction,
  encodeRebalancerAction,
  encodeCompounderAction,
  encodeCompounderStakedAction,
  encodeYieldClaimerAction,
  encodeYieldClaimerCowswapAction,
  encodeCowSwapperAction,
  encodeMerklOperatorAction,
];
