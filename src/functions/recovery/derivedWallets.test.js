import test from "node:test";
import assert from "node:assert/strict";
import { deriveRecoveryMnemonic, RECOVERY_SPACES, scanUntilGap } from "./derivedWallets.js";

const seed = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test("Blitz derivation namespaces stay distinct and stable", async () => {
  const fixtures = [
    ["accounts", 1, "current", "name exile social van valid whale behind danger project language coast tiger"],
    ["savings", 1, "current", "right monkey model escape peasant change puzzle today able helmet early change"],
    ["pools", 1, "current", "soul ridge oven yellow truck coral document ski fitness swarm galaxy pony"],
    ["gifts", 1, "current", "other october draft boring leopard sail mechanic peace jump athlete three tumble"],
    ["children", 1, "current", "gentle hurt salmon wife wish aware outdoor furnace dutch pistol wing palm"],
    ["gifts", 42, "legacy", "course slam label accident liberty analyst stamp shallow sponsor moral pact express"],
    ["gifts", 1, "legacy-offset", "leave follow fee thrive paper unfold boss hair myself believe leader universe"],
  ];
  for (const [space, index, variant, expected] of fixtures) {
    assert.equal(await deriveRecoveryMnemonic(seed, space, index, variant), expected);
  }
});

test("displayed account numbers map one-to-one onto Blitz path indices", async () => {
  assert.equal(RECOVERY_SPACES.accounts.offset + RECOVERY_SPACES.accounts.start, 4);
  assert.equal(RECOVERY_SPACES.accounts.offset + 10, 13);
  assert.equal(RECOVERY_SPACES.accounts.offset + RECOVERY_SPACES.accounts.end, 999);
  assert.equal(RECOVERY_SPACES.gifts.offset + RECOVERY_SPACES.gifts.end, 99999);
  await assert.rejects(deriveRecoveryMnemonic(seed, "accounts", 0));
  await assert.rejects(deriveRecoveryMnemonic(seed, "accounts", 997));
});

test("continue scan resumes after a 15-wallet gap", async () => {
  const checked = [];
  const visit = async (index) => { checked.push(index); return index === 17; };
  const firstNext = await scanUntilGap({ start: 1, end: 100, visit });
  assert.equal(firstNext, 16);
  assert.deepEqual(checked, Array.from({ length: 15 }, (_, index) => index + 1));
  const secondNext = await scanUntilGap({ start: firstNext, end: 100, visit });
  assert.equal(secondNext, 33);
  assert.equal(checked.filter((index) => index === 16).length, 1);
  assert.equal(checked.filter((index) => index === 17).length, 1);
});
