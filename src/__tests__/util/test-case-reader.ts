import {promises as fs} from "fs"
import { parse } from "csv-parse/sync"

import { RoundResults } from "../../results.js";

export async function readTestCases(filename: string): Promise<RoundResults[]> {
  const path = `${__dirname}/../testcases/${filename}.csv`
  const csv = await readCsv(path)
  const rounds = parseRounds(csv)
  return rounds
}

function parseRounds(data: Array<Record<string, string>>): RoundResults[] {
  const roundResults: RoundResults[] = []
  for (let round = 1; round in data[0]; round++) {
    const roundResult: RoundResults = { round, pairings: [] }
    const players = new Set<string>()

    for (const row of data) {
      const playerId = row['#']

      // +B10
      const info = row[round]
      const score = {'+': 1, '=': 0.5, '-': 0}[info[0]]
      const color = info[1] as 'W' | 'B'
      const opponentId = info.substring(2)

      if (!players.has(opponentId)) {
        roundResult.pairings.push({ 
          white: color === 'W' ? playerId : opponentId,
          black: color === 'B' ? playerId : opponentId,
          scoreWhite: (color === 'W' ? score : 1 - score) as Score,
          scoreBlack: (color === 'B' ? score : 1 - score) as Score,
          // TODO: support forfeits
          forfeited: false
        })
      }
      players.add(playerId)
    }
    roundResults.push(roundResult)
  }
  return roundResults
}

async function readCsv(filename: string): Promise<Array<Record<string, string>>> {
  const content = await fs.readFile(filename)
  return parse(content, {columns: true}) as Array<Record<string, string>>
}
