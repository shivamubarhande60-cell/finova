import assert from "node:assert/strict";
import test from "node:test";
import { isValidMobileNumber, parseMobileNumber } from "./phone.ts";

test("normalizes a valid Indian mobile number", () => {
  assert.equal(parseMobileNumber("9876543210"), "+919876543210");
});

test("rejects invalid and non-mobile numbers", () => {
  assert.equal(isValidMobileNumber("12345"), false);
  assert.equal(isValidMobileNumber("+44 20 8366 1177"), false);
});