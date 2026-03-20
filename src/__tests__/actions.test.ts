import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../shared/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("../shared/wallet", () => ({
  initWallet: vi.fn(async () => ({
    getWalletClient: vi.fn(() => ({
      account: { address: "0x1234567890abcdef1234567890abcdef12345678" },
      sendTransaction: vi.fn(async () => "0xtxhash"),
      chain: { id: 8453 },
    })),
    getPublicClient: vi.fn(() => ({
      readContract: vi.fn(async () => 0n),
    })),
    getAddress: vi.fn(
      () => "0x1234567890abcdef1234567890abcdef12345678",
    ),
  })),
}));

vi.mock("@elizaos/core", () => ({
  ModelType: { TEXT_SMALL: "text_small" },
  composePromptFromState: vi.fn(() => "mocked prompt"),
  parseKeyValueXml: vi.fn((xml: string) => {
    const result: Record<string, string> = {};
    const tagRegex = /<(\w+)>([^<]*)<\/\1>/g;
    let match;
    while ((match = tagRegex.exec(xml)) !== null) {
      result[match[1]] = match[2];
    }
    return Object.keys(result).length > 0 ? result : null;
  }),
}));

import { createAccountAction } from "../actions/createAccount";
import { depositAction } from "../actions/deposit";
import { withdrawAction } from "../actions/withdraw";
import { borrowAction } from "../actions/borrow";
import { repayAction } from "../actions/repay";
import { approveAction } from "../actions/approve";
import { encodeRebalancerAction } from "../actions/encodeRebalancer";
import { encodeCompounderAction } from "../actions/encodeCompounder";
import { encodeCowSwapperAction } from "../actions/encodeCowSwapper";
import { encodeMerklOperatorAction } from "../actions/encodeMerklOperator";
import { encodeYieldClaimerAction } from "../actions/encodeYieldClaimer";

const VALID_PK =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

const mockMessage = (text: string) =>
  ({
    content: { text },
    userId: "test-user",
    roomId: "test-room",
  }) as never;

const runtimeWithPk = {
  getSetting: vi.fn((key: string) => {
    if (key === "EVM_PRIVATE_KEY") return VALID_PK;
    return null;
  }),
  useModel: vi.fn(),
  composeState: vi.fn(async () => ({})),
  getService: vi.fn(),
} as never;

const runtimeWithoutPk = {
  getSetting: vi.fn(() => null),
  useModel: vi.fn(),
  composeState: vi.fn(async () => ({})),
  getService: vi.fn(),
} as never;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createAccountAction", () => {
  it("validate returns true with create + account + PK", async () => {
    const result = await createAccountAction.validate(
      runtimeWithPk,
      mockMessage("Create a new Arcadia account"),
    );
    expect(result).toBe(true);
  });

  it("validate returns false without PK", async () => {
    const result = await createAccountAction.validate(
      runtimeWithoutPk,
      mockMessage("Create a new Arcadia account"),
    );
    expect(result).toBe(false);
  });

  it("validate returns false without matching keywords", async () => {
    const result = await createAccountAction.validate(
      runtimeWithPk,
      mockMessage("Show me my balance"),
    );
    expect(result).toBe(false);
  });
});

describe("depositAction", () => {
  it("validate returns true for deposit keyword + PK", async () => {
    const result = await depositAction.validate(
      runtimeWithPk,
      mockMessage("Deposit 1000 USDC into my Arcadia account"),
    );
    expect(result).toBe(true);
  });

  it("validate returns false without PK", async () => {
    const result = await depositAction.validate(
      runtimeWithoutPk,
      mockMessage("Deposit 1000 USDC"),
    );
    expect(result).toBe(false);
  });

  it("validate returns false without deposit keyword", async () => {
    const result = await depositAction.validate(
      runtimeWithPk,
      mockMessage("Show me my balance"),
    );
    expect(result).toBe(false);
  });
});

describe("withdrawAction", () => {
  it("validate returns true for withdraw keyword + PK", async () => {
    const result = await withdrawAction.validate(
      runtimeWithPk,
      mockMessage("Withdraw 500 USDC from my Arcadia account"),
    );
    expect(result).toBe(true);
  });

  it("validate returns false without PK", async () => {
    const result = await withdrawAction.validate(
      runtimeWithoutPk,
      mockMessage("Withdraw 500 USDC"),
    );
    expect(result).toBe(false);
  });
});

describe("borrowAction", () => {
  it("validate returns true for borrow keyword + PK", async () => {
    const result = await borrowAction.validate(
      runtimeWithPk,
      mockMessage("Borrow 1000 USDC from the USDC pool"),
    );
    expect(result).toBe(true);
  });

  it("validate returns false without PK", async () => {
    const result = await borrowAction.validate(
      runtimeWithoutPk,
      mockMessage("Borrow 1000 USDC"),
    );
    expect(result).toBe(false);
  });
});

describe("repayAction", () => {
  it("validate returns true for repay keyword + PK", async () => {
    const result = await repayAction.validate(
      runtimeWithPk,
      mockMessage("Repay 500 USDC to the lending pool"),
    );
    expect(result).toBe(true);
  });

  it("validate returns false without PK", async () => {
    const result = await repayAction.validate(
      runtimeWithoutPk,
      mockMessage("Repay 500 USDC"),
    );
    expect(result).toBe(false);
  });
});

describe("approveAction", () => {
  it("validate returns true for approve keyword + PK", async () => {
    const result = await approveAction.validate(
      runtimeWithPk,
      mockMessage("Approve USDC for my Arcadia account"),
    );
    expect(result).toBe(true);
  });

  it("validate returns false without PK", async () => {
    const result = await approveAction.validate(
      runtimeWithoutPk,
      mockMessage("Approve USDC"),
    );
    expect(result).toBe(false);
  });
});

describe("encoder actions validate without PK", () => {
  const encoderActions = [
    { name: "encodeRebalancer", action: encodeRebalancerAction },
    { name: "encodeCompounder", action: encodeCompounderAction },
    { name: "encodeCowSwapper", action: encodeCowSwapperAction },
    { name: "encodeMerklOperator", action: encodeMerklOperatorAction },
    { name: "encodeYieldClaimer", action: encodeYieldClaimerAction },
  ];

  for (const { name, action } of encoderActions) {
    it(`${name}: validate returns true without PK`, async () => {
      const result = await action.validate(
        runtimeWithoutPk,
        mockMessage("encode something"),
      );
      expect(result).toBe(true);
    });
  }
});

describe("encodeRebalancerAction handler", () => {
  it("returns JSON with asset_managers, statuses, datas", async () => {
    const mockRuntimeForHandler = {
      getSetting: vi.fn(() => null),
      useModel: vi.fn(async () => "<response><dexProtocol>slipstream</dexProtocol><enabled>true</enabled></response>"),
      composeState: vi.fn(async () => ({ recentMessages: "" })),
      getService: vi.fn(),
    } as never;

    const callbackFn = vi.fn();

    const result = await encodeRebalancerAction.handler(
      mockRuntimeForHandler,
      mockMessage("Encode the rebalancer for slipstream"),
      undefined,
      {},
      callbackFn,
    );

    expect(result.success).toBe(true);
    const parsed = JSON.parse(result.text);
    expect(parsed).toHaveProperty("asset_managers");
    expect(parsed).toHaveProperty("statuses");
    expect(parsed).toHaveProperty("datas");
    expect(Array.isArray(parsed.asset_managers)).toBe(true);
    expect(parsed.asset_managers.length).toBe(1);
    expect(parsed.statuses).toEqual([true]);
    expect(parsed.datas.length).toBe(1);
    expect(parsed.datas[0]).toMatch(/^0x/);
  });

  it("returns disable data when enabled is false", async () => {
    const mockRuntimeForHandler = {
      getSetting: vi.fn(() => null),
      useModel: vi.fn(async () => "<response><dexProtocol>slipstream</dexProtocol><enabled>false</enabled></response>"),
      composeState: vi.fn(async () => ({ recentMessages: "" })),
      getService: vi.fn(),
    } as never;

    const callbackFn = vi.fn();

    const result = await encodeRebalancerAction.handler(
      mockRuntimeForHandler,
      mockMessage("Disable the rebalancer"),
      undefined,
      {},
      callbackFn,
    );

    expect(result.success).toBe(true);
    const parsed = JSON.parse(result.text);
    expect(parsed.statuses).toEqual([false]);
    expect(parsed.datas).toEqual(["0x"]);
    expect(parsed.description).toContain("Disable");
  });
});

describe("encodeCompounderAction handler", () => {
  it("returns JSON with enable data", async () => {
    const mockRuntimeForHandler = {
      getSetting: vi.fn(() => null),
      useModel: vi.fn(async () => "<response><dexProtocol>slipstream</dexProtocol><enabled>true</enabled></response>"),
      composeState: vi.fn(async () => ({ recentMessages: "" })),
      getService: vi.fn(),
    } as never;

    const result = await encodeCompounderAction.handler(
      mockRuntimeForHandler,
      mockMessage("Encode the compounder for slipstream"),
      undefined,
      {},
    );

    expect(result.success).toBe(true);
    const parsed = JSON.parse(result.text);
    expect(parsed.asset_managers.length).toBe(1);
    expect(parsed.statuses).toEqual([true]);
    expect(parsed.datas[0]).toMatch(/^0x/);
    expect(parsed.description).toContain("Enable compounder");
  });
});

describe("encodeCowSwapperAction handler", () => {
  it("returns JSON with enable data", async () => {
    const mockRuntimeForHandler = {
      getSetting: vi.fn(() => null),
      useModel: vi.fn(async () => "<response><enabled>true</enabled></response>"),
      composeState: vi.fn(async () => ({ recentMessages: "" })),
      getService: vi.fn(),
    } as never;

    const result = await encodeCowSwapperAction.handler(
      mockRuntimeForHandler,
      mockMessage("Enable the CowSwap swapper"),
      undefined,
      {},
    );

    expect(result.success).toBe(true);
    const parsed = JSON.parse(result.text);
    expect(parsed.asset_managers.length).toBe(1);
    expect(parsed.statuses).toEqual([true]);
    expect(parsed.description).toContain("cow_swapper");
  });
});
