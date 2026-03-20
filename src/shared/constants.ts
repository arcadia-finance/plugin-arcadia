import type { Address } from "viem";

export const SUPPORTED_CHAINS = [8453] as const;

export const FACTORY_ADDRESS: Address =
  "0xDa14Fdd72345c4d2511357214c5B89A919768e59";
export const REGISTRY_ADDRESS: Address =
  "0xd0690557600eb8Be8391D1d97346e2aab5300d5f";
export const LIQUIDATOR_ADDRESS: Address =
  "0xA4B0b9fD1d91fA2De44F6ABFd59cC14bA1E1a7Af";
export const ACTION_MULTICALL_ADDRESS: Address =
  "0xa48D4201030C09CEA82f5B0955b9C837699D3c32";

export const POOLS: Record<
  string,
  { address: Address; name: string; decimals: number }
> = {
  LP_WETH: {
    address: "0x803ea69c7e87D1d6C86adeB40CB636cC0E6B98E2",
    name: "wETH",
    decimals: 18,
  },
  LP_USDC: {
    address: "0x3ec4a293Fb906DD2Cd440c20dECB250DeF141dF1",
    name: "USDC",
    decimals: 6,
  },
  LP_CBBTC: {
    address: "0xa37E9b4369dc20940009030BfbC2088F09645e3B",
    name: "cbBTC",
    decimals: 8,
  },
};

export const TOKENS: Record<string, { address: Address; decimals: number }> = {
  WETH: {
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
  },
  USDC: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
  cbBTC: {
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    decimals: 8,
  },
  AERO: {
    address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
    decimals: 18,
  },
};

export const API_BASE_URL = "https://api.arcadia.finance/v1/api";

export const ERC8021_SUFFIX =
  "62635f75336733343434700b0080218021802180218021802180218021";
