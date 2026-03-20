const SUPPORTED_CHAINS: Record<string, number> = {
  base: 8453,
};

export function resolveChain(chainNameOrId: string | number): number | null {
  if (typeof chainNameOrId === "number") {
    return Object.values(SUPPORTED_CHAINS).includes(chainNameOrId)
      ? chainNameOrId
      : null;
  }
  return SUPPORTED_CHAINS[chainNameOrId.toLowerCase()] ?? null;
}
