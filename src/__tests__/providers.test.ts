import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../shared/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("../shared/wallet", () => ({
  initWallet: vi.fn(async () => ({
    getAddress: vi.fn(() => "0x1234567890abcdef1234567890abcdef12345678"),
    getWalletClient: vi.fn(),
    getPublicClient: vi.fn(),
  })),
}));

import { apiGet } from "../shared/api";
import { poolListProvider } from "../providers/poolList";
import { strategyListProvider } from "../providers/strategyList";
import { walletAccountsProvider } from "../providers/walletAccounts";
import { accountInfoProvider } from "../providers/accountInfo";
import { guidesProvider } from "../providers/guides";

const mockedApiGet = vi.mocked(apiGet);

const mockMessage = (text: string) =>
  ({
    content: { text },
    userId: "test-user",
    roomId: "test-room",
  }) as never;

const mockRuntime = {
  getSetting: vi.fn((key: string) => {
    if (key === "EVM_PRIVATE_KEY")
      return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    return null;
  }),
  useModel: vi.fn(),
  composeState: vi.fn(async () => ({})),
  getService: vi.fn(),
} as never;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("poolListProvider", () => {
  it("returns formatted text when message contains pool", async () => {
    mockedApiGet.mockResolvedValueOnce([
      {
        name: "USDC",
        address: "0xpool1",
        apy: 0.045,
        utilisation: 0.72,
        total_realised_liquidity_usd: 5200000,
      },
      {
        name: "WETH",
        address: "0xpool2",
        apy: 0.032,
        utilisation: 0.55,
        total_realised_liquidity_usd: 8100000,
      },
    ]);

    const result = await poolListProvider.get(
      mockRuntime,
      mockMessage("Show me the lending pools"),
      {},
    );
    expect(result.text).toContain("Arcadia Lending Pools");
    expect(result.text).toContain("USDC Pool");
    expect(result.text).toContain("WETH Pool");
    expect(result.text).toContain("4.50%");
    expect(result.text).toContain("3.20%");
  });

  it("returns empty when message is irrelevant", async () => {
    const result = await poolListProvider.get(
      mockRuntime,
      mockMessage("What is the weather today?"),
      {},
    );
    expect(result.text).toBe("");
    expect(mockedApiGet).not.toHaveBeenCalled();
  });

  it("returns empty pools message when API returns empty array", async () => {
    mockedApiGet.mockResolvedValueOnce([]);

    const result = await poolListProvider.get(
      mockRuntime,
      mockMessage("Show me the lending pools"),
      {},
    );
    expect(result.text).toContain("No lending pools found");
  });

  it("returns empty on API error", async () => {
    mockedApiGet.mockRejectedValueOnce(new Error("Network error"));

    const result = await poolListProvider.get(
      mockRuntime,
      mockMessage("Show me the lending pools"),
      {},
    );
    expect(result.text).toBe("");
  });
});

describe("strategyListProvider", () => {
  it("returns formatted text when message contains strategy", async () => {
    mockedApiGet.mockResolvedValueOnce([
      {
        id: 42,
        display_name: "sCL200-USDC-WETH",
        apy: 0.152,
        protocol: "slipstream",
        numeraire: "usdc",
        leverage: 3,
        is_spot: false,
      },
    ]);

    const result = await strategyListProvider.get(
      mockRuntime,
      mockMessage("What strategies are available?"),
      {},
    );
    expect(result.text).toContain("Featured LP Strategies");
    expect(result.text).toContain("#42");
    expect(result.text).toContain("sCL200-USDC-WETH");
    expect(result.text).toContain("15.20%");
    expect(result.text).toContain("Leverage up to 3x");
  });

  it("shows Spot for spot strategies", async () => {
    mockedApiGet.mockResolvedValueOnce([
      {
        id: 10,
        display_name: "Spot-WETH",
        apy: 0.05,
        protocol: "slipstream",
        numeraire: "weth",
        leverage: 1,
        is_spot: true,
      },
    ]);

    const result = await strategyListProvider.get(
      mockRuntime,
      mockMessage("Show me strategies"),
      {},
    );
    expect(result.text).toContain("Spot");
  });

  it("returns empty when message is irrelevant", async () => {
    const result = await strategyListProvider.get(
      mockRuntime,
      mockMessage("Send 1 ETH to Bob"),
      {},
    );
    expect(result.text).toBe("");
  });
});

describe("walletAccountsProvider", () => {
  it("calls API with correct params and returns accounts", async () => {
    mockedApiGet.mockResolvedValueOnce({
      accounts: [
        {
          account_address: "0xaaa",
          creation_version: 3,
          numeraire: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        },
        {
          account_address: "0xbbb",
          creation_version: 4,
          numeraire: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        },
      ],
    });

    const result = await walletAccountsProvider.get(
      mockRuntime,
      mockMessage("List my arcadia accounts"),
      {},
    );

    expect(mockedApiGet).toHaveBeenCalledWith("/accounts", {
      chain_id: 8453,
      owner: "0x1234567890abcdef1234567890abcdef12345678",
    });
    expect(result.text).toContain("2 Arcadia account(s)");
    expect(result.text).toContain("0xaaa");
    expect(result.text).toContain("0xbbb");
  });

  it("handles empty accounts", async () => {
    mockedApiGet.mockResolvedValueOnce({ accounts: [] });

    const result = await walletAccountsProvider.get(
      mockRuntime,
      mockMessage("Show my arcadia accounts"),
      {},
    );
    expect(result.text).toContain("No Arcadia accounts found");
  });

  it("returns empty on API error", async () => {
    mockedApiGet.mockRejectedValueOnce(new Error("Network error"));

    const result = await walletAccountsProvider.get(
      mockRuntime,
      mockMessage("List my arcadia accounts"),
      {},
    );
    expect(result.text).toBe("");
  });
});

describe("accountInfoProvider", () => {
  it("returns formatted account data for margin account", async () => {
    mockedApiGet.mockResolvedValueOnce({
      owner: "0x1234",
      creditor: "0x803ea69c7e87D1d6C86adeB40CB636cC0E6B98E2",
      health_factor: 0.85,
      collateral_value: "10000",
      debt_value: "1500",
      assets: [{ address: "0xusdc", symbol: "USDC", amount: "10000" }],
    });

    const result = await accountInfoProvider.get(
      mockRuntime,
      mockMessage(
        "Show account info for 0x1234567890abcdef1234567890abcdef12345678",
      ),
      {},
    );
    expect(result.text).toContain("Health Factor: 85.0%");
    expect(result.text).toContain("Margin");
    expect(result.text).toContain("USDC");
    expect(result.text).toContain("10000");
  });

  it("identifies spot accounts", async () => {
    mockedApiGet.mockResolvedValueOnce({
      owner: "0x1234",
      creditor: "0x0000000000000000000000000000000000000000",
      health_factor: null,
      collateral_value: "5000",
      debt_value: "0",
      assets: [],
    });

    const result = await accountInfoProvider.get(
      mockRuntime,
      mockMessage(
        "Get account info for 0x1234567890abcdef1234567890abcdef12345678",
      ),
      {},
    );
    expect(result.text).toContain("Spot");
    expect(result.text).toContain("N/A");
  });

  it("returns empty when no address in message", async () => {
    const result = await accountInfoProvider.get(
      mockRuntime,
      mockMessage("Show account info"),
      {},
    );
    expect(result.text).toBe("");
    expect(mockedApiGet).not.toHaveBeenCalled();
  });

  it("returns empty when message is irrelevant", async () => {
    const result = await accountInfoProvider.get(
      mockRuntime,
      mockMessage("What is the weather?"),
      {},
    );
    expect(result.text).toBe("");
  });
});

describe("guidesProvider", () => {
  it("returns overview guide for generic help", async () => {
    const result = await guidesProvider.get(
      mockRuntime,
      mockMessage("I need a tutorial on Arcadia basics"),
      {},
    );
    expect(result.text).toContain("Guide:");
    expect(result.text).toContain("Arcadia Finance");
  });

  it("returns strategies guide when message mentions strategy", async () => {
    const result = await guidesProvider.get(
      mockRuntime,
      mockMessage("I need a guide about strategy options"),
      {},
    );
    expect(result.text).toContain("Guide: strategies");
    expect(result.text).toContain("concentrated liquidity");
  });

  it("returns automations guide when message mentions rebalance", async () => {
    const result = await guidesProvider.get(
      mockRuntime,
      mockMessage("How to rebalance? Guide me."),
      {},
    );
    expect(result.text).toContain("Guide: automations");
    expect(result.text).toContain("Rebalancer");
  });

  it("returns empty when message is irrelevant", async () => {
    const result = await guidesProvider.get(
      mockRuntime,
      mockMessage("Send 1 ETH to Bob"),
      {},
    );
    expect(result.text).toBe("");
  });
});
