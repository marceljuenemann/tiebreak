import { describe, expect, it } from "vitest"

import { TiebreakCalculation, UnplayedRoundsAdjustment } from "../tiebreak.js"

describe("TiebreakCalculation", () => {
  describe('score', () => {
    // TODO: Support half-point byes
    it('should sum score of all pairings', () => {
      const tiebreak = new TiebreakCalculation([
        { round: 1, pairings: [{ white: 'A', black: 'B', scoreWhite: 1, scoreBlack: 0, forfeited: false }] },
        { round: 2, pairings: [{ white: 'C', black: 'A', scoreWhite: 0, scoreBlack: 1, forfeited: true }] },
        { round: 3, pairings: [{ white: 'C', black: 'B', scoreWhite: 0.5, scoreBlack: 0.5, forfeited: false }] },
        { round: 4, pairings: [{ white: 'B', black: 'A', scoreWhite: 1, scoreBlack: 0, forfeited: true }] },
      ], { unplayedRoundsAdjustment: UnplayedRoundsAdjustment.NONE })

      expect(tiebreak.score('A', 1)).toEqual(1)
      expect(tiebreak.score('A', 2)).toEqual(2)
      expect(tiebreak.score('A', 3)).toEqual(2)
      expect(tiebreak.score('A', 4)).toEqual(2)
      expect(tiebreak.score('B', 1)).toEqual(0)
      expect(tiebreak.score('B', 2)).toEqual(0)
      expect(tiebreak.score('B', 3)).toEqual(0.5)
      expect(tiebreak.score('B', 4)).toEqual(1.5)
      expect(tiebreak.score('C', 1)).toEqual(0)
      expect(tiebreak.score('C', 2)).toEqual(0)
      expect(tiebreak.score('C', 3)).toEqual(0.5)
      expect(tiebreak.score('C', 4)).toEqual(0.5)
    })
  })
})

/*
import { Ranking, TieBreak } from './ranking';

fdescribe('Ranking', () => {
  

  describe('buchholz', () => {
    describe('classic', () => {
      it('should sum points of opponents', () => {
        const ranking = new Ranking([
          { round: 1, white: 'A', black: 'B', scoreWhite: '1', scoreBlack: '0' },
          { round: 2, white: 'C', black: 'A', scoreWhite: '0.5', scoreBlack: '0.5' },
          { round: 3, white: 'B', black: 'A', scoreWhite: '-', scoreBlack: '+' },
        ])

        expect(ranking.tieBreak(TieBreak.BuchholzClassic, 'A', 1)).toEqual(0)
        expect(ranking.tieBreak(TieBreak.BuchholzClassic, 'B', 1)).toEqual(1)
        expect(ranking.tieBreak(TieBreak.BuchholzClassic, 'C', 1)).toEqual(0)
        expect(ranking.tieBreak(TieBreak.BuchholzClassic, 'A', 2)).toEqual(0 + 0.5)
        expect(ranking.tieBreak(TieBreak.BuchholzClassic, 'B', 2)).toEqual(1.5)
        expect(ranking.tieBreak(TieBreak.BuchholzClassic, 'C', 2)).toEqual(1.5)
        expect(ranking.tieBreak(TieBreak.BuchholzClassic, 'A', 3)).toEqual(0 + 0.5)
        expect(ranking.tieBreak(TieBreak.BuchholzClassic, 'B', 3)).toEqual(2 * 2.5)
        expect(ranking.tieBreak(TieBreak.BuchholzClassic, 'C', 3)).toEqual(2.5)
      })
    })

    describe('2009', () => {
      it('should count any unplayed games of opponents as draw', () => {
        const ranking = new Ranking([
          // B is our opponent with unplayed games.
          { round: 1, white: 'A', black: 'B', scoreWhite: '1', scoreBlack: '0' },
          { round: 2, white: 'B', black: 'X', scoreWhite: '+', scoreBlack: '-' },
          // Not paired in round 3. Should still count as draw.
          { round: 4, white: 'B', black: 'Y', scoreWhite: '-', scoreBlack: '+' },
          // A and A's other opponents played all games.
          { round: 2, white: 'A', black: 'C', scoreWhite: '1', scoreBlack: '0' },
          { round: 3, white: 'A', black: 'D', scoreWhite: '1', scoreBlack: '0' },
          { round: 4, white: 'A', black: 'E', scoreWhite: '1', scoreBlack: '0' },
          { round: 1, white: 'C', black: 'Cx', scoreWhite: '1', scoreBlack: '0' },
          { round: 3, white: 'C', black: 'Cy', scoreWhite: '1', scoreBlack: '0' },
          { round: 4, white: 'C', black: 'Cz', scoreWhite: '1', scoreBlack: '0' },
          { round: 1, white: 'D', black: 'Dx', scoreWhite: '1', scoreBlack: '0' },
          { round: 2, white: 'D', black: 'Dy', scoreWhite: '1', scoreBlack: '0' },
          { round: 4, white: 'D', black: 'Dz', scoreWhite: '1', scoreBlack: '0' },
          { round: 1, white: 'E', black: 'Ex', scoreWhite: '1', scoreBlack: '0' },
          { round: 2, white: 'E', black: 'Ey', scoreWhite: '1', scoreBlack: '0' },
          { round: 3, white: 'E', black: 'Ez', scoreWhite: '1', scoreBlack: '0' },
        ])

        expect(ranking.tieBreak(TieBreak.Buchholz2009, 'A', 1)).toEqual(0)
        expect(ranking.tieBreak(TieBreak.Buchholz2009, 'A', 2)).toEqual(1 * 0.5 + 1 * 1)
        expect(ranking.tieBreak(TieBreak.Buchholz2009, 'A', 3)).toEqual(2 * 0.5 + 2 * 2)
        expect(ranking.tieBreak(TieBreak.Buchholz2009, 'A', 4)).toEqual(3 * 0.5 + 3 * 3)
      })

      fit('should use virtual opponents for unplayed games', () => {
        const ranking = new Ranking([
          { round: 1, white: 'A', black: 'B', scoreWhite: '1', scoreBlack: '0' },
          { round: 2, white: 'A', black: 'B', scoreWhite: '+', scoreBlack: '-' },
        ])

        // A's first opponent contributes (0 + 0.5) and the second (1 + 0)
        expect(ranking.tieBreak(TieBreak.Buchholz2009, 'A', 2)).toEqual(0.5 + 1)
        // B's first opponent contributes (1 + 0.5) and the second (0 + 1)
        expect(ranking.tieBreak(TieBreak.Buchholz2009, 'B', 2)).toEqual(1.5 + 1)

        // Round 3 (neither A nor B paired)
        expect(ranking.tieBreak(TieBreak.Buchholz2009, 'A', 3)).toEqual((0 + 2 * 0.5) + (1 + 0 + 0.5) + (2 + 1))
        expect(ranking.tieBreak(TieBreak.Buchholz2009, 'B', 3)).toEqual((1 + 2 * 0.5) + (0 + 1 + 0.5) + (0 + 1))
      })
    })
  })
})
*/
