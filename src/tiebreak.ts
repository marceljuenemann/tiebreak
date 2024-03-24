import { PlayerId, RoundResults, Score } from "./results.js"

export enum UnplayedRoundsAdjustment {
  /**
   * Any unplayed games are counted according to the points that were scored.
   * No "virtual opponents" are created when a player was not paired against
   * a real player.
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

  constructor(
    results: RoundResults[],
    private config: TiebreakConfig,
  ) {
    this.results = new ResultMap(results)
  }

  /**
   * Returns the total points the given player scored by the given round.
   */
  public score(player: PlayerId, round: number): number {
    return this.sum(this.results.getAll(player, round).map((result) => {
      return this.scoreForResult(result)
    }))
  }

  private scoreForResult(result: PlayerResult): number {
    switch (result) {
      case "unpaired":
        return 0
      case "allocated-bye":
        return 1
      case "half-point-bye":
        return 0.5
      default:
        return result.score
    }
  }

  /**
   * Returns the players score with unplayed rounds adjusted according to the configured UnplayedRoundsAdjustment.
   */
  public adjustedScore(player: PlayerId, round: number): number {
    if (this.config.unplayedRoundsAdjustment === UnplayedRoundsAdjustment.NONE) {
      return this.score(player, round)
    }
    const rounds = this.results.getAll(player, round).map((result) => {
      switch (result) {
        case "unpaired":
        case "allocated-bye":
        case "half-point-bye":
          return 0.5
        default:
          return result.forfeited ? 0.5 : result.score
      }
    })
    return this.sum(rounds)
  }

  /**
   * Buchholz score. Note that unplayed games are adjusted according to the configured UnplayedRoundsAdjustment.
   */
  public buchholz(player: PlayerId, round: number): number {
    const opponentScores = this.results.getAll(player, round).map((result, index) => {
      const currentRound = index + 1
      switch (this.config.unplayedRoundsAdjustment) {
        case UnplayedRoundsAdjustment.NONE:
          return isPaired(result) ? this.adjustedScore(result.opponent, round) : 0

        case UnplayedRoundsAdjustment.FIDE_2009:
        case UnplayedRoundsAdjustment.FIDE_LATEST:
          if (isPlayed(result)) {
            return this.adjustedScore(result.opponent, round)
          } else {
            // Use a virtual opponent.
            const initialScore = this.score(player, currentRound - 1)
            const gameScore = 1 - this.scoreForResult(result)
            const virtualPoints = (round - currentRound) * 0.5
            return initialScore + gameScore + virtualPoints
          }
      }
    })
    return this.sum(opponentScores)
  }

  private sum(numbers: number[]): number {
    return numbers.reduce((prev, curr) => prev + curr, 0)
  }
}

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
type PlayerResult = PlayerPairing | "allocated-bye" | "half-point-bye" | "unpaired"

function isPaired(result: PlayerResult): result is PlayerPairing {
  return typeof result === "object"
}

function isPlayed(result: PlayerResult): result is PlayerPairing {
  return isPaired(result) && !result.forfeited
}

/**
 * Lookup map for results for a specific player.
 */
class ResultMap {
  private pairings: Map<PlayerId, Map<number, PlayerResult>> = new Map()

  constructor(results: RoundResults[]) {
    for (const round of results) {
      for (const pairing of round.pairings) {
        this.addToMap(pairing.white, round.round, {
          score: pairing.scoreWhite,
          opponentScore: pairing.scoreBlack,
          opponent: pairing.black,
          forfeited: pairing.forfeited,
        })
        this.addToMap(pairing.black, round.round, {
          score: pairing.scoreBlack,
          opponentScore: pairing.scoreWhite,
          opponent: pairing.white,
          forfeited: pairing.forfeited,
        })
      }
      for (const player of round.pairingAllocatedByes ?? []) {
        this.addToMap(player, round.round, "allocated-bye")
      }
      for (const player of round.halfPointByes ?? []) {
        this.addToMap(player, round.round, "half-point-bye")
      }
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
  public get(playerId: PlayerId, round: number): PlayerResult {
    return this.pairings.get(playerId)?.get(round) ?? "unpaired"
  }

  /**
   * Returns all results for a player up to the given round. The length of the returned
   * array will be the same as the round number, with null values for rounds where the
   * player was not paired and did not receive a bye.
   */
  public getAll(playerId: PlayerId, maxRound: number): PlayerResult[] {
    return Array.from(Array(maxRound).keys()).map((round) => this.get(playerId, round + 1))
  }
}
