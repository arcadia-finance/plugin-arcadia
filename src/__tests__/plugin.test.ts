import { describe, it, expect } from "vitest";
import { arcadiaPlugin } from "../plugin";

describe("arcadiaPlugin", () => {
  it("has correct name", () => {
    expect(arcadiaPlugin.name).toBe("arcadia-finance");
  });

  it("has 20 actions", () => {
    expect(arcadiaPlugin.actions).toHaveLength(20);
  });

  it("has 17 providers", () => {
    expect(arcadiaPlugin.providers).toHaveLength(17);
  });

  it("depends on evm plugin", () => {
    expect(arcadiaPlugin.dependencies).toContain("evm");
  });

  it("has no duplicate action names", () => {
    const names = arcadiaPlugin.actions!.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("has no duplicate provider names", () => {
    const names = arcadiaPlugin.providers!.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("all actions have validate function", () => {
    for (const action of arcadiaPlugin.actions!) {
      expect(typeof action.validate).toBe("function");
    }
  });

  it("all actions have handler function", () => {
    for (const action of arcadiaPlugin.actions!) {
      expect(typeof action.handler).toBe("function");
    }
  });

  it("all actions have non-empty similes", () => {
    for (const action of arcadiaPlugin.actions!) {
      expect(action.similes!.length).toBeGreaterThan(0);
    }
  });

  it("all actions have non-empty examples", () => {
    for (const action of arcadiaPlugin.actions!) {
      expect(action.examples!.length).toBeGreaterThan(0);
    }
  });

  it("all providers have name", () => {
    for (const provider of arcadiaPlugin.providers!) {
      expect(typeof provider.name).toBe("string");
      expect(provider.name!.length).toBeGreaterThan(0);
    }
  });

  it("all providers have description", () => {
    for (const provider of arcadiaPlugin.providers!) {
      expect(typeof provider.description).toBe("string");
      expect(provider.description!.length).toBeGreaterThan(0);
    }
  });

  it("all providers have get function", () => {
    for (const provider of arcadiaPlugin.providers!) {
      expect(typeof provider.get).toBe("function");
    }
  });

  it("encoder actions validate returns true without EVM_PRIVATE_KEY", async () => {
    const encoderActions = arcadiaPlugin.actions!.filter((a) =>
      a.name.startsWith("ARCADIA_ENCODE"),
    );
    expect(encoderActions.length).toBeGreaterThan(0);

    const mockRuntime = {
      getSetting: () => null,
    } as never;
    const mockMessage = {
      content: { text: "test" },
      userId: "test",
      roomId: "test",
    } as never;

    for (const action of encoderActions) {
      const result = await action.validate(mockRuntime, mockMessage);
      expect(result).toBe(true);
    }
  });

  it("write actions require EVM_PRIVATE_KEY in validate", async () => {
    const writeActions = arcadiaPlugin.actions!.filter(
      (a) => !a.name.startsWith("ARCADIA_ENCODE"),
    );
    expect(writeActions.length).toBeGreaterThan(0);

    const mockRuntime = {
      getSetting: () => null,
    } as never;

    for (const action of writeActions) {
      const mockMessage = {
        content: { text: action.similes![0] },
        userId: "test",
        roomId: "test",
      } as never;
      const result = await action.validate(mockRuntime, mockMessage);
      expect(result).toBe(false);
    }
  });

  it("no em dashes in any action description", () => {
    for (const action of arcadiaPlugin.actions!) {
      expect(action.description).not.toContain("\u2014");
      expect(action.description).not.toContain("\u2013");
    }
  });

  it("no em dashes in any provider description", () => {
    for (const provider of arcadiaPlugin.providers!) {
      expect(provider.description).not.toContain("\u2014");
      expect(provider.description).not.toContain("\u2013");
    }
  });

  it("total count is 20 actions + 17 providers = 37", () => {
    expect(arcadiaPlugin.actions!.length + arcadiaPlugin.providers!.length).toBe(37);
  });
});
