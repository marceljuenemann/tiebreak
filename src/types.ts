
export type Score = 0 | 0.5 | 1

/**
 * Unique identifier for a player. This can be any string that uniquely identifies a player.
 */
export type PlayerId = string

/**
 * Results of a tournament round.
 */
export type RoundResults = {
  /**
   * Round number.
   */
  round: number

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
