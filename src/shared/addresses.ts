export type DexProtocol =
  | "slipstream"
  | "slipstream_v2"
  | "staked_slipstream"
  | "staked_slipstream_v2"
  | "uniV3"
  | "uniV4";

type AmProtocol = "slipstreamV1" | "slipstreamV2" | "uniV3" | "uniV4";

const PROTOCOL_TO_AM_KEY: Record<DexProtocol, AmProtocol> = {
  slipstream: "slipstreamV1",
  slipstream_v2: "slipstreamV2",
  staked_slipstream: "slipstreamV1",
  staked_slipstream_v2: "slipstreamV2",
  uniV3: "uniV3",
  uniV4: "uniV4",
};

const AM_ADDRESSES = {
  rebalancers: {
    slipstreamV1: "0x5802454749cc0c4A6F28D5001B4cD84432e2b79F",
    slipstreamV2: "0x953Ff365d0b562ceC658dc46B394E9282338d9Ea",
    uniV3: "0xbA1D0c99c261F94b9C8b52465890Cca27dd993Bd",
    uniV4: "0x01EDaF0067a10D18c88D2876c0A85Ee0096a5Ac0",
  },
  compounders: {
    slipstreamV1: "0x467837f44A71e3eAB90AEcfC995c84DC6B3cfCF7",
    slipstreamV2: "0x35e59448C7145482E56212510cC689612AB4F61f",
    uniV3: "0x02e1fa043214E51eDf1F0478c6D0d3D5658a2DC3",
    uniV4: "0xAA95c9c402b195D8690eCaea2341a76e3266B189",
  },
  yieldClaimers: {
    slipstreamV1: "0x5a8278D37b7a787574b6Aa7E18d8C02D994f18Ba",
    slipstreamV2: "0xc8bF4B2c740FF665864E9494832520f18822871C",
    uniV3: "0x75Ed28EA8601Ce9F5FbcAB1c2428f04A57aFaA16",
    uniV4: "0xD8aa21AB7f9B8601CB7d7A776D3AFA1602d5D8D4",
  },
};

export const STANDALONE_AM = {
  merklOperator: "0x969F0251360b9Cf11c68f6Ce9587924c1B8b42C6",
  cowSwapper: "0xc928013A219EC9F18dE7B2dee6A50Ba626811854",
};

export function getAmAddress(
  category: "rebalancers" | "compounders" | "yieldClaimers",
  dexProtocol: DexProtocol,
): string {
  return AM_ADDRESSES[category][PROTOCOL_TO_AM_KEY[dexProtocol]];
}
