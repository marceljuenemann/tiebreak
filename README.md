# Tiebreak: FIDE compliant tournament tiebreak calculation

![NPM](https://img.shields.io/npm/l/tiebreak)
![NPM](https://img.shields.io/npm/v/tiebreak)
![GitHub Workflow Status](https://github.com/marceljuenemann/tiebreak/actions/workflows/tiebreak.yml/badge.svg?branch=main)

Tiebreak is a TypeScript library for calculating various tournament tiebreak scores. The focus lies on chess tournaments and implementing the algorithms specified by FIDE, the world chess organization.

## Features

**Calculation of the following tiebreakers:**

- Buchholz
- Buchholz with modifiers (Cut-1, Cut-2, Median-1 etc.)
- Sonneborn-Berger
- (more to come)

**Configurable adjustments for unplayed games:**

- FIDE regulations from 2023 ("dummy opponent")
- FIDE regulations from 2009 ("virtual opponent")
- No adjustment for unplayed games

**Built in calculation of entire tournament rankings**

_Note: Only individual Swiss tournaments are currently supported. Team tournaments and round robin tournaments are not implemented correctly yet._

## Installation

`npm install --save tiebreak`

## Usage

First, you need to create a `Results` object with all relevant pairing information. You can use an arbitrary string or number to identify players.

```typescript
import { Results, TournamentType } from "tiebreak"

const results = new Results(TournamentType.SWISS, [
  {
    // Example round 1: Player D did not show up
    pairings: [
      { white: "C", black: "A", scoreWhite: 0.5, scoreBlack: 0.5, forfeited: false },
      { white: "B", black: "D", scoreWhite: 1, scoreBlack: 0, forfeited: true },
    ],
  },
  {
    // Example round 2: Player D was not paired, player C received a bye
    pairings: [{ white: "A", black: "B", scoreWhite: 0, scoreBlack: 1, forfeited: false }],
    pairingAllocatedByes: ["C"],
  },
])
```

You can now calculate a specific tiebreak score for a given player and round like this:

```typescript
const tiebreaker = new Tiebreaker(results, UnplayedRoundsAdjustment.FIDE_2023)
console.log(tiebreaker.buchholz("A", 2))
// Output: 3.5
```

Or you can just calculate an entire ranking with multiple tiebreakers:

```typescript
console.log(tiebreaker.ranking(2, [Tiebreak.SCORE, Tiebreak.BUCHHOLZ]))
/*
  Output:
  [
    { rank: 1, playerId: "B", scores: [2, 2.5] },
    { rank: 2, playerId: "C", scores: [1.5, 2] },
    { rank: 3, playerId: "A", scores: [0.5, 3.5] },
    { rank: 4, playerId: "D", scores: [0, 0] },
  ]
*/
```

## Project Goals

- **FIDE compliant:** Stay up-to-date with the FIDE Tie-Break Regulations as specified in the [FIDE Handbook](https://handbook.fide.com/) section C 07
- **Backwards compatible:** It should be possible to run calculations according to old versions of the FIDE Regulations and old versions of this library. Updates of this library should not automatically lead to new calculations, unless the new algorithm is selected. This is also important for calculating tie breaks of past tournaments. _Note: Alpha versions of this library (0.x) do not guarantee backwards compatibility_
- **Readable code:** The code is optimized for being readable and easy to understand. Reduction of code duplication and speed of execution are only minor goals.
- **Extensively tested:** The code should be extensively covered by unit tests.
- **Opinionated:** The library does not try to implement every possible tie break with every possible configuration. Instead, the focus lies on implementing tie breaks and configurations that make the most sense to use in real tournaments.

## Release Notes

See https://github.com/marceljuenemann/tiebreak/releases

## Development

- Build: `npm run build`
- Unit tests: `npm run test` or `npm run test:watch`
- Unit test coverage: `npm run test:coverage` (Not working yet?)
- Format code: `npm run format`
- Lint: `npm run lint`
- Spell check: `npm run spell:check`

**Deployment procedure:**

- Increase version
- Push to main and ensure all workflows are passing
- `npm run build`
- `npm publish`
- Create release on GitHub with release notes
