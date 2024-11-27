import { describe, expect, it } from "vitest"

import { Results, RoundResults, Score, TournamentType } from "../results.js"
import { Modifier, Tiebreak, Tiebreaker, UnplayedRoundsAdjustment } from "../tiebreak.js"
import { readTestCases } from "./util/test-case-reader.js"

describe("TiebreakCalculation", () => {
  describe("score", () => {
    it("should sum score of all pairings", () => {
      const results = new Results(TournamentType.SWISS, [
        round(["A:B 1:0"]),
        round(["C:A 0:1 forfeit"]),
        round(["C:B 0.5:0.5"]),
        round(["B:A 1:0 forfeit"]),
      ])

      const tiebreak = new Tiebreaker(results, UnplayedRoundsAdjustment.NONE)
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
      const tiebreak = new Tiebreaker(
        new Results(TournamentType.SWISS, [
          { pairings: [], pairingAllocatedByes: ["A"] },
          { pairings: [], halfPointByes: ["A"] },
        ]),
        UnplayedRoundsAdjustment.NONE,
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
        const rounds = new Results(TournamentType.SWISS, [
          round(["A:B 1:0"]),
          round(["C:A 0.5:0.5"]),
          round(["B:A 0:1 forfeit"]),
        ])
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.NONE)

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

      it("should pass FIDE exercise 1 (2023)", async () => {
        const rounds = await readTestCases("fide-exercise-2023")
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.NONE)
        expect(tiebreak.buchholz("2", 5)).toEqual(13)
      })

      it("should pass FIDE exercise 2 (2023)", async () => {
        const rounds = await readTestCases("fide-exercise-2023")
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.NONE)
        expect(tiebreak.buchholz("1", 5)).toEqual(12.5)
        expect(tiebreak.buchholz("3", 5)).toEqual(15.5)
      })

      it("should NOT pass FIDE exercise 3 (2023)", async () => {
        const rounds = await readTestCases("fide-exercise-2023")
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.NONE)
        expect(tiebreak.buchholz("5", 5)).toEqual(8.5)
        expect(tiebreak.buchholz("8", 5)).toEqual(13.5)
        expect(tiebreak.buchholz("11", 5)).toEqual(12.5) // 13.5 with FIDE_2023
      })
    })

    describe("with FIDE_2023 unplayed rounds adjustment", () => {
      it("should pass FIDE exercise 1 (2023)", async () => {
        const rounds = await readTestCases("fide-exercise-2023")
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.FIDE_2023)
        expect(tiebreak.buchholz("2", 5)).toEqual(13)
      })

      it("should pass FIDE exercise 2 (2023)", async () => {
        const rounds = await readTestCases("fide-exercise-2023")
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.FIDE_2023)
        expect(tiebreak.buchholz("1", 5)).toEqual(12.5)
        expect(tiebreak.buchholz("3", 5)).toEqual(15.5)
      })

      it("should pass FIDE exercise 3 (2023)", async () => {
        const rounds = await readTestCases("fide-exercise-2023")
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.FIDE_2023)
        expect(tiebreak.buchholz("5", 5)).toEqual(8.5)
        expect(tiebreak.buchholz("8", 5)).toEqual(13.5)
        expect(tiebreak.buchholz("11", 5)).toEqual(13.5)
      })

      it("should pass FIDE exercise 4 (2023)", async () => {
        const rounds = await readTestCases("fide-exercise-2023")
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.FIDE_2023)
        expect(tiebreak.buchholz("1", 5)).toEqual(12.5)
        expect(tiebreak.buchholz("3", 5)).toEqual(15.5)
        expect(tiebreak.buchholz("16", 5)).toEqual(12.5)
        expect(tiebreak.buchholz("4", 5)).toEqual(15.0)
      })
    })

    describe("with FIDE_2009 unplayed rounds adjustment", () => {
      // TODO: byes
      it("should count any unplayed games of opponents as draw", () => {
        const rounds = new Results(TournamentType.SWISS, [
          round(["A:B 1:0", "C:Cx 1:0", "D:Dx 1:0", "E:Ex 1:0"]),
          round(["B:X 1:0 forfeit", "A:C 1:0", "D:Dy 1:0", "E:Ey 1:0"]),
          round(["A:D 1:0", "C:Cy 1:0", "E:Ez 1:0"]),
          round(["B:Y 0:1 forfeit", "A:E 1:0", "C:Cz 1:0", "D:Dz 1:0"]),
        ])
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.FIDE_2009)

        expect(tiebreak.buchholz("A", 1)).toEqual(0)
        expect(tiebreak.buchholz("A", 2)).toEqual(1 * 0.5 + 1 * 1)
        expect(tiebreak.buchholz("A", 3)).toEqual(2 * 0.5 + 2 * 2)
        expect(tiebreak.buchholz("A", 4)).toEqual(3 * 0.5 + 3 * 3)
      })

      it("should use virtual opponents for unplayed games", () => {
        const rounds = new Results(TournamentType.SWISS, [
          round(["A:B 1:0"]),
          round(["A:B 1:0 forfeit"]),
        ])
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.FIDE_2009)

        // A's first opponent contributes (0 + 0.5) and the second (1 + 0)
        expect(tiebreak.buchholz("A", 2)).toEqual(0.5 + 1)
        // B's first opponent contributes (1 + 0.5) and the second (0 + 1)
        expect(tiebreak.buchholz("B", 2)).toEqual(1.5 + 1)

        // Round 3 (neither A nor B paired)
        expect(tiebreak.buchholz("A", 3)).toEqual(0 + 2 * 0.5 + (1 + 0 + 0.5) + (2 + 1))
        expect(tiebreak.buchholz("B", 3)).toEqual(1 + 2 * 0.5 + (0 + 1 + 0.5) + (0 + 1))
      })
    })
  })

  describe("buchholz with Cut-1 modifier", () => {
    describe("with FIDE_2023 unplayed rounds adjustment", () => {
      it("should pass FIDE exercise 5 (2023)", async () => {
        const rounds = await readTestCases("fide-exercise-2023")
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.FIDE_2023)
        expect(tiebreak.buchholz("5", 5, Modifier.CUT_1)).toEqual(7.5)
        expect(tiebreak.buchholz("8", 5, Modifier.CUT_1)).toEqual(12)
        expect(tiebreak.buchholz("11", 5, Modifier.CUT_1)).toEqual(12)
      })

      it("should pass FIDE exercise 6 (2023)", async () => {
        const rounds = await readTestCases("fide-exercise-2023")
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.FIDE_2023)
        expect(tiebreak.buchholz("7", 5, Modifier.CUT_1)).toEqual(12.5)
        expect(tiebreak.buchholz("9", 5, Modifier.CUT_1)).toEqual(7.5)
        expect(tiebreak.buchholz("13", 5, Modifier.CUT_1)).toEqual(12)
      })

      it("should pass FIDE exercise 7 (2023)", async () => {
        const rounds = await readTestCases("fide-exercise-2023")
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.FIDE_2023)
        expect(tiebreak.buchholz("1", 5, Modifier.CUT_1)).toEqual(11.0)
        expect(tiebreak.buchholz("3", 5, Modifier.CUT_1)).toEqual(13)
        expect(tiebreak.buchholz("4", 5, Modifier.CUT_1)).toEqual(11.5)
        expect(tiebreak.buchholz("16", 5, Modifier.CUT_1)).toEqual(11)
      })

      it("should pass FIDE exercise 8 (2023)", async () => {
        const rounds = await readTestCases("fide-exercise-2023")
        const tiebreak = new Tiebreaker(rounds, UnplayedRoundsAdjustment.FIDE_2023)
        expect(tiebreak.buchholz("12", 5, Modifier.CUT_1)).toEqual(9.5)
        expect(tiebreak.buchholz("14", 5, Modifier.CUT_1)).toEqual(9)
        expect(tiebreak.buchholz("15", 5, Modifier.CUT_1)).toEqual(11)
      })
    })

    /*
    describe("with FIDE_2009 unplayed rounds adjustment", () => {
      // TODO
    })

    describe("without unplayed rounds adjustment", () => {
      // TODO
    })
    */
  })

  describe("ranking", () => {
    it("should rank simple tournament", () => {
      const results = new Results(TournamentType.SWISS, [
        {
          // Round 1: Player D did not show up
          pairings: [
            { white: "C", black: "A", scoreWhite: 0.5, scoreBlack: 0.5, forfeited: false },
            { white: "B", black: "D", scoreWhite: 1, scoreBlack: 0, forfeited: true },
          ],
        },
        {
          // Round 2: Player D was not paired
          pairings: [{ white: "A", black: "B", scoreWhite: 0, scoreBlack: 1, forfeited: false }],
          pairingAllocatedByes: ["C"],
        },
      ])
      const tiebreak = new Tiebreaker(results, UnplayedRoundsAdjustment.FIDE_2023)
      expect(tiebreak.ranking(2, [Tiebreak.SCORE, Tiebreak.BUCHHOLZ])).toEqual([
        { playerId: "B", rank: 1, scores: [2, 2.5] }, // BH: 2 for unplayed + 0.5 for A
        { playerId: "C", rank: 2, scores: [1.5, 2] }, // BH: 0.5 for A + 1.5 for bye
        { playerId: "A", rank: 3, scores: [0.5, 3.5] }, // BH: 1.5 for C + 2 for B
        { playerId: "D", rank: 4, scores: [0, 0] }, // BH: 2 * 0 for unplayed rounds
      ])
    })

    it("should return tied players on the same rank", () => {
      const results = new Results(TournamentType.SWISS, [
        {
          // Round 1: Player D did not show up
          pairings: [
            { white: "C", black: "A", scoreWhite: 0.5, scoreBlack: 0.5, forfeited: false },
            { white: "B", black: "D", scoreWhite: 1, scoreBlack: 0, forfeited: false },
          ],
        },
      ])
      const tiebreak = new Tiebreaker(results, UnplayedRoundsAdjustment.FIDE_2023)
      expect(tiebreak.ranking(1, [Tiebreak.SCORE, Tiebreak.BUCHHOLZ])).toEqual([
        { playerId: "B", rank: 1, scores: [1, 0] },
        { playerId: "A", rank: 2, scores: [0.5, 0.5] },
        { playerId: "C", rank: 2, scores: [0.5, 0.5] },
        { playerId: "D", rank: 4, scores: [0, 1] },
      ])
    })
  })
})

/**
 * Helper for specifying a round results in a more readable format, e.g. "A B 1 0".
 */
// TODO: Use something like Results.fromStrings()
function round(pairings: string[]): RoundResults {
  return {
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
    }),
  }
}
