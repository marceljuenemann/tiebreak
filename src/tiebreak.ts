import { PlayerId, RoundResults, Score } from "./results.js"

export enum UnplayedRoundsAdjustment {
  /**
   * Any unplayed games are counted according to the points that were scored.
   */
  NONE = "NONE",

  /**
   * Unplayed games are adjusted according to the latest FIDE rules. Keep in mind
   * that calculations can change as the code is updated, so this setting is not
   * recommended if you want calculations to be stable over time, e.g. when
   * calculating tiebreaks for historic tournaments.
   */
  FIDE_LATEST = "FIDE_LATEST",

  // TODO
  // FIDE_2023 = "FIDE_2023",

  /**
   * Adjustments according to FIDE regulations from 2009. If you had opponents who had
   * unplayed games, those unplayed games are always counted as a draw. If you had
   * unplayed games yourself, your Buchholz is calculated using a 'virtual opponent'.
   * The virtual opponent is assumed to have the same points as you initially and
   * score a draw in all following rounds.
   */
  FIDE_2009 = "FIDE_2009",
}

export type TiebreakConfig = {
  /**
   * How to adjust unplayed games for the calculation of Buchholz, Sonneborn-Berger, and
   * other tiebreaks that are based on opponents' results.
   */
  unplayedRoundsAdjustment: UnplayedRoundsAdjustment
}

/**
 * Calculates tiebreaks for a tournament with the given results and configuration.
 */
// TODO: Add caching/memoization to avoid constant recalculation.
export class TiebreakCalculation {
  private results: ResultMap

  constructor(results: RoundResults[], private config: TiebreakConfig) {
    this.results = new ResultMap(results)
  }

  /**
   * Returns the total points the given player scored by the given round.
   */
  public score(player: PlayerId, round: number): number {
    return this.sum(this.results.getAll(player, round).map(result => {
      if (result === null) {
        return 0
      } else if (result === 'allocated-bye') {
        return 1
      } else if (result === 'half-point-bye') {
        return 0.5
      } else {
        return result.score
      }
    }))
  }

  private sum(nums: number[]): number {
    return nums.reduce((prev, curr) => prev + curr, 0)
  }
}

/*
export class Ranking {
  private pairings: PairingMap

  constructor(pairings: Pairing[]) {
    this.pairings = new PairingMap(pairings)
  }

  tieBreak(tieBreak: TieBreak | InternalScore, playerId: PlayerId, round: number): number {
    switch (tieBreak) {
      case TieBreak.Points:
        return this.sum(this.pairings.getAll(playerId, round).map(pairing => {
          return this.pointsForScore(pairing.score)
        }))

      case TieBreak.BuchholzClassic:
        return this.sum(this.pairings.getAll(playerId, round).map(pairing => {
          return this.tieBreak(TieBreak.Points, pairing.opponent, round)
        }))

      case TieBreak.Buchholz2009:
        let sum = 0.0
        for (let r = 1; r <= round; r++) {
          const pairing = this.pairings.get(playerId, r)
          if (pairing && !this.isBye(pairing.score)) {
            // Actually played game, add opponent's points (adjusted for unplayed games)
            sum += this.tieBreak(InternalScore.BuchholzForOpponent, pairing.opponent, round)
          } else {
            // Score Buchholz using a virtual opponent.
            const initialPoints = this.tieBreak(TieBreak.Points, playerId, r - 1)
            const gamePoints = pairing && pairing.score == '+' ? 0 : 1
            const virtualPoints = (round - r) * 0.5
            sum += initialPoints + gamePoints + virtualPoints
          }
        }
        return sum

      case InternalScore.BuchholzForOpponent:
        // Any unplayed games are counted as 0.5, whether the player was paired or not.
        const played = this.pairings.getAll(playerId, round).filter(pairing => {
          return !this.isBye(pairing.score)
        })
        const playedSum = this.sum(played.map(pairing => this.pointsForScore(pairing.score)))
        const unplayedSum = (round - played.length) * 0.5
        return playedSum + unplayedSum
    }
  }

  private pointsForScore(score: Score): number {
    switch (score) {
      case '0':
        return 0
      case '0.5':
        return 0.5
      case '1':
        return 1
      case '-':
        return 0
      case '+':
        return 1
    }
  }

  private isBye(score: Score): boolean {
    return score == '+' || score == '-'
  }

}
*/


/**
 * Pairing from the view of the player.
 */
interface PlayerPairing {
  score: Score
  opponentScore: Score
  opponent: PlayerId
  forfeited: boolean
}

/**
 * A round's result from the view of the player.
 */
type PlayerResult = PlayerPairing | 'allocated-bye' | 'half-point-bye'

/**
 * Lookup map for results for a specific player.
 */
class ResultMap {
  private pairings: Map<PlayerId, Map<number, PlayerResult>> = new Map()

  constructor(results: RoundResults[]) {
    for (const round of results) {
      for (let pairing of round.pairings) {
        this.addToMap(pairing.white, round.round, {
          score: pairing.scoreWhite,
          opponentScore: pairing.scoreBlack,
          opponent: pairing.black,
          forfeited: pairing.forfeited
        })
        this.addToMap(pairing.black, round.round, {
          score: pairing.scoreBlack,
          opponentScore: pairing.scoreWhite,
          opponent: pairing.white,
          forfeited: pairing.forfeited
        })
      }
      // TODO: Handle byes
    }
  }

  private addToMap(playerId: PlayerId, round: number, result: PlayerResult) {
    if (!this.pairings.has(playerId)) {
      this.pairings.set(playerId, new Map())
    }
    if (this.pairings.get(playerId)?.has(round)) {
      throw new Error(`Multiple results in round ${round} for player ${playerId}`)
    }
    this.pairings.get(playerId)?.set(round, result)
  }

  /**
   * Returns the result for the given player and round.
   */
  public get(playerId: PlayerId, round: number): PlayerResult | null {
    return this.pairings.get(playerId)?.get(round) ?? null
  }

  /**
   * Returns all results for a player up to the given round. The length of the returned
   * array will be the same as the round number, with null values for rounds where the
   * player was not paired and did not receive a bye.
   */
  public getAll(playerId: PlayerId, maxRound: number): (PlayerResult | null)[] {
    return Array.from(Array(maxRound).keys()).map(round => this.get(playerId, round + 1))
  }
}
