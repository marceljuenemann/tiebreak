import { beforeEach, describe, expect, it } from "vitest"

import { TieBreakCalculator } from "../tiebreak.js"

describe("TieBreakCalculator", () => {
  let tiebreak: TieBreakCalculator

  beforeEach(() => {
    tiebreak = new TieBreakCalculator()
  })

  describe("helloWorld", () => {
    it("returns expected string", () => {
      expect(tiebreak.helloWorld()).toEqual("Hello World!")
    })
  })
})
