import type { IAgentRuntime } from "@elizaos/core";

// The plugin-evm package exports initWalletProvider as a named export at runtime
// but the d.ts has a circular re-export that TS can't resolve.
// Import the module and extract the function manually.
interface WalletProviderInstance {
  getAddress(): string;
  getPublicClient(chainName: string): ReturnType<typeof import("viem")["createPublicClient"]> & {
    readContract: (args: unknown) => Promise<unknown>;
  };
  getWalletClient(chainName: string): ReturnType<typeof import("viem")["createWalletClient"]> & {
    sendTransaction: (args: unknown) => Promise<`0x${string}`>;
    chain: unknown;
    account: unknown;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _initWalletProvider: ((runtime: IAgentRuntime) => Promise<WalletProviderInstance>) | null = null;

async function getInitWalletProvider(): Promise<(runtime: IAgentRuntime) => Promise<WalletProviderInstance>> {
  if (!_initWalletProvider) {
    // Dynamic import to avoid the circular d.ts issue
    const mod = await import("@elizaos/plugin-evm");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _initWalletProvider = (mod as any).initWalletProvider;
  }
  return _initWalletProvider!;
}

export async function initWallet(runtime: IAgentRuntime): Promise<WalletProviderInstance> {
  const init = await getInitWalletProvider();
  return init(runtime);
}

export type { WalletProviderInstance };
