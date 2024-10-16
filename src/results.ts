export type Score = 0 | 0.5 | 1

/**
 * Unique identifier for a player. Exact format is up to the caller.
 */
export type PlayerId = string | number

/**
 * Results of a tournament round.
 */
export type RoundResults = {
  /**
   * Pairings for this round.
   */
  pairings: Pairing[]

  /**
   * IDs of players who were allocated a bye by the pairing algorithm. This is usually
   * one player if the number of players is odd and no player if the number of players
   * is even.
   */
  pairingAllocatedByes?: PlayerId[]

  /**
   * Some tournaments have a half-point bye system where players can request a bye and receive
   * half a point.
   */
  halfPointByes?: PlayerId[]
}

export type Pairing = {
  white: PlayerId
  black: PlayerId
  scoreWhite: Score
  scoreBlack: Score
  forfeited: boolean
}

/**
 * Immutable representation of a tournament's pairings and results.
 */
export class Results {
  private pairings: Map<PlayerId, Map<number, PlayerResult>> = new Map()

  constructor(results: RoundResults[]) {
    for (const [roundIndex, roundResults] of results.entries()) {
      for (const pairing of roundResults.pairings) {
        this.addToMap(pairing.white, roundIndex + 1, {
          score: pairing.scoreWhite,
          opponentScore: pairing.scoreBlack,
          opponent: pairing.black,
          forfeited: pairing.forfeited,
        })
        this.addToMap(pairing.black, roundIndex + 1, {
          score: pairing.scoreBlack,
          opponentScore: pairing.scoreWhite,
          opponent: pairing.white,
          forfeited: pairing.forfeited,
        })
      }
      for (const player of roundResults.pairingAllocatedByes ?? []) {
        this.addToMap(player, roundIndex + 1, "allocated-bye")
      }
      for (const player of roundResults.halfPointByes ?? []) {
        this.addToMap(player, roundIndex + 1, "half-point-bye")
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
   * Returns results for a player for each round up to the given maxRound.
   */
  public getAll(playerId: PlayerId, maxRound: number): PlayerResult[] {
    return Array.from(Array(maxRound).keys()).map((i) => this.get(playerId, i + 1))
  }
}

/**
 * Pairing from the view of the player.
 */
export interface PlayerPairing {
  score: Score
  opponentScore: Score
  opponent: PlayerId
  forfeited: boolean
}

/**
 * A round's result from the view of the player.
 */
export type PlayerResult = PlayerPairing | "allocated-bye" | "half-point-bye" | "unpaired"

export function isPaired(result: PlayerResult): result is PlayerPairing {
  return typeof result === "object"
}

export function isPlayed(result: PlayerResult): result is PlayerPairing {
  return isPaired(result) && !result.forfeited
}

export function isForfeitLoss(result: PlayerResult): boolean {
  return isPaired(result) && result.forfeited && result.score === 0
}

/**
 * Voluntarily Unplayed Rounds (VUR) are defined in the FIDE regulations and in some cases
 * handled differently from rounds in which the player was "available to play".
 */
export function isVoluntarilyUnplayedRound(result: PlayerResult): boolean {
  return result === 'unpaired' || result === 'half-point-bye' || isForfeitLoss(result)
}
