# Tiebreak: FIDE compliant tournament tiebreak calculation

![NPM](https://img.shields.io/npm/l/tiebreak)
![NPM](https://img.shields.io/npm/v/tiebreak)
![GitHub Workflow Status](https://github.com/marceljuenemann/tiebreak/actions/workflows/tiebreak.yml/badge.svg?branch=main)

Tiebreak is a TypeScript library for calculating various tournament tiebreak scores. The focus lies on chess tournaments and implementing the algorithms specified by FIDE, the world chess organization.

## Supported Tie Breaks

**Note: Only individual Swiss tournaments are currently supported. Team tournaments and round robin tournaments are not implemented correctly yet.**

- Buchholz
  - _Work in progress:_ Modifiers (Cut-1, Cut-2, Median1, Median2)

## Goals

- **FIDE compliant:** Stay up-to-date with the FIDE Tie-Break Regulations as specified in the [FIDE Handbook](https://handbook.fide.com/) section C 07
- **Backwards compatible:** It should be possible to run calculations according to old versions of the FIDE Regulations and old versions of this library. Updates of this library should not automatically lead to new calculations, unless the new algorithm is selected. This is also important for calculating tie breaks of past tournaments. _Note: Alpha versions of this library (0.x) do not guarantee backwards compatibility_
- **Readable code:** The code is optimized for being readable and easy to understand. Reduction of code duplication and speed of execution are only minor goals.
- **Extensively tested:** The code should be extensively covered by unit tests.
- **Opinionated:** The library does not try to implement every possible tie break with every possible configuration. Instead, the focus lies on implementing tie breaks and configurations that make the most sense to use in real tournaments.

## Installation

TODO

## Usage

TODO

## Development

- Build: `npm run build`
- Unit tests: `npm run test` or `npm run test:watch`
- Unit test coverage: `npm run test:coverage` (Not working yet?)
- Format code: `npm run format`
- Lint: `npm run lint`
- Spell check: `npm run spell:check`
