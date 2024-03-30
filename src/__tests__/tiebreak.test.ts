import { describe, expect, it } from "vitest"

import { RoundResults, Score } from "../results.js"
import { TiebreakCalculation, UnplayedRoundsAdjustment } from "../tiebreak.js"
import { readTestCases } from "./util/test-case-reader.js"

describe("TiebreakCalculation", () => {
  describe("score", () => {
    it("should sum score of all pairings", () => {
      const results = [
        round(1, ["A:B 1:0"]),
        round(2, ["C:A 0:1 forfeit"]),
        round(3, ["C:B 0.5:0.5"]),
        round(4, ["B:A 1:0 forfeit"]),
      ]

      const tiebreak = new TiebreakCalculation(results, {
        unplayedRoundsAdjustment: UnplayedRoundsAdjustment.NONE,
      })
      expect(tiebreak.score("A", 1)).toEqual(1)
      expect(tiebreak.score("A", 2)).toEqual(2)
      expect(tiebreak.score("A", 3)).toEqual(2)
      expect(tiebreak.score("A", 4)).toEqual(2)
      expect(tiebreak.score("B", 1)).toEqual(0)
      expect(tiebreak.score("B", 2)).toEqual(0)
      expect(tiebreak.score("B", 3)).toEqual(0.5)
      expect(tiebreak.score("B", 4)).toEqual(1.5)
      expect(tiebreak.score("C", 1)).toEqual(0)
      expect(tiebreak.score("C", 2)).toEqual(0)
      expect(tiebreak.score("C", 3)).toEqual(0.5)
      expect(tiebreak.score("C", 4)).toEqual(0.5)
    })

    it("should score byes correctly", () => {
      const tiebreak = new TiebreakCalculation(
        [
          { round: 1, pairings: [], pairingAllocatedByes: ["A"] },
          { round: 2, pairings: [], halfPointByes: ["A"] },
        ],
        { unplayedRoundsAdjustment: UnplayedRoundsAdjustment.NONE },
      )

      expect(tiebreak.score("A", 1)).toEqual(1)
      expect(tiebreak.score("A", 2)).toEqual(1.5)
      expect(tiebreak.score("A", 3)).toEqual(1.5)
    })
  })

  describe("buchholz", () => {
    describe("without unplayed rounds adjustment", () => {
      // TODO: test byes
      it("should sum points of opponents", () => {
        const rounds = [
          round(1, ["A:B 1:0"]),
          round(2, ["C:A 0.5:0.5"]),
          round(3, ["B:A 0:1 forfeit"]),
        ]
        const tiebreak = new TiebreakCalculation(rounds, {
          unplayedRoundsAdjustment: UnplayedRoundsAdjustment.NONE,
        })

        expect(tiebreak.buchholz("A", 1)).toEqual(0)
        expect(tiebreak.buchholz("B", 1)).toEqual(1)
        expect(tiebreak.buchholz("C", 1)).toEqual(0)
        expect(tiebreak.buchholz("A", 2)).toEqual(0 + 0.5)
        expect(tiebreak.buchholz("B", 2)).toEqual(1.5)
        expect(tiebreak.buchholz("C", 2)).toEqual(1.5)
        expect(tiebreak.buchholz("A", 3)).toEqual(0 + 0.5)
        expect(tiebreak.buchholz("B", 3)).toEqual(2 * 2.5)
        expect(tiebreak.buchholz("C", 3)).toEqual(2.5)
      })

      it("should pass fide-exercise-2023-01", async () => {
        const rounds = await readTestCases("fide-exercise-2023-01")
        const tiebreak = new TiebreakCalculation(rounds, {
          unplayedRoundsAdjustment: UnplayedRoundsAdjustment.NONE,
        })
        expect(tiebreak.buchholz('2', 5)).toEqual(13)
      })

      it("should pass fide-exercise-2023-02", async () => {
        const rounds = await readTestCases("fide-exercise-2023-02")
        const tiebreak = new TiebreakCalculation(rounds, {
          unplayedRoundsAdjustment: UnplayedRoundsAdjustment.NONE,
        })
        expect(tiebreak.buchholz('1', 5)).toEqual(12.5)
        expect(tiebreak.buchholz('3', 5)).toEqual(15.5)
      })
    })

    describe('with FIDE_2009 unplayed rounds adjustment', () => {
      // TODO: byes
      it('should count any unplayed games of opponents as draw', () => {
        const rounds = [
          round(1, ['A:B 1:0', 'C:Cx 1:0', 'D:Dx 1:0', 'E:Ex 1:0']),
          round(2, ['B:X 1:0 forfeit', 'A:C 1:0', 'D:Dy 1:0', 'E:Ey 1:0']),
          round(3, ['A:D 1:0', 'C:Cy 1:0', 'E:Ez 1:0']),
          round(4, ['B:Y 0:1 forfeit', 'A:E 1:0', 'C:Cz 1:0', 'D:Dz 1:0']),
        ]
        const tiebreak = new TiebreakCalculation(rounds, {
          unplayedRoundsAdjustment: UnplayedRoundsAdjustment.FIDE_2009,
        })

        expect(tiebreak.buchholz('A', 1)).toEqual(0)
        expect(tiebreak.buchholz('A', 2)).toEqual(1 * 0.5 + 1 * 1)
        expect(tiebreak.buchholz('A', 3)).toEqual(2 * 0.5 + 2 * 2)
        expect(tiebreak.buchholz('A', 4)).toEqual(3 * 0.5 + 3 * 3)
      })

      it('should use virtual opponents for unplayed games', () => {
        const rounds = [
          round(1, ['A:B 1:0']),
          round(2, ['A:B 1:0 forfeit']),
        ]
        const tiebreak = new TiebreakCalculation(rounds, {
          unplayedRoundsAdjustment: UnplayedRoundsAdjustment.FIDE_2009,
        })

        // A's first opponent contributes (0 + 0.5) and the second (1 + 0)
        expect(tiebreak.buchholz('A', 2)).toEqual(0.5 + 1)
        // B's first opponent contributes (1 + 0.5) and the second (0 + 1)
        expect(tiebreak.buchholz('B', 2)).toEqual(1.5 + 1)

        // Round 3 (neither A nor B paired)
        expect(tiebreak.buchholz('A', 3)).toEqual((0 + 2 * 0.5) + (1 + 0 + 0.5) + (2 + 1))
        expect(tiebreak.buchholz('B', 3)).toEqual((1 + 2 * 0.5) + (0 + 1 + 0.5) + (0 + 1))
      })
    })
  })
})

/**
 * Helper for specifying a round results in a more readable format, e.g. "A B 1 0".
 */
function round(round: number, pairings: string[]): RoundResults {
  return {
    round,
    pairings: pairings.map((pairing) => {
      const [white, black, scoreWhite, scoreBlack, forfeited] = pairing
        .replaceAll(":", " ")
        .split(" ")
      return {
        white,
        black,
        scoreWhite: parseFloat(scoreWhite) as Score,
        scoreBlack: parseFloat(scoreBlack) as Score,
        forfeited: !!forfeited,
      }
    })
  }
}
