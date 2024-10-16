import { promises as fs } from "fs"
import { parse } from "csv-parse/sync"

import { Results, RoundResults, Score, TournamentType } from "../../results.js"

export async function readTestCases(filename: string): Promise<Results> {
  const path = `${__dirname}/../testcases/${filename}.csv`
  const csv = await readCsv(path)
  const rounds = parseRounds(csv)
  return new Results(TournamentType.SWISS, rounds)
}

function parseRounds(data: Array<Record<string, string>>): RoundResults[] {
  const roundResults: RoundResults[] = []
  for (let round = 1; round in data[0]; round++) {
    const roundResult: RoundResults = { pairings: [], pairingAllocatedByes: [], halfPointByes: [] }
    const players = new Set<string>()

    for (const row of data) {
      const playerId = row["#"]

      // Parse result, e.g. +B10, =BYE, -F11
      const info = row[round]
      const score = { "+": 1, "=": 0.5, "-": 0 }[info[0]] as Score
      if (info.substring(1) === "BYE") {
        if (score == 1) {
          roundResult.pairingAllocatedByes?.push(playerId)
        } else if (score == 0.5) {
          roundResult.halfPointByes?.push(playerId)
        }
      } else if (info !== "--") {
        const color = info[1] as "W" | "B" | "F"
        const opponentId = info.substring(2)
        if (!players.has(opponentId)) {
          roundResult.pairings.push({
            white: color === "W" ? playerId : opponentId,
            black: color !== "W" ? playerId : opponentId,
            scoreWhite: (color === "W" ? score : 1 - score) as Score,
            scoreBlack: (color !== "W" ? score : 1 - score) as Score,
            forfeited: color === "F",
          })
        }
      }
      players.add(playerId)
    }
    roundResults.push(roundResult)
  }
  return roundResults
}

async function readCsv(filename: string): Promise<Array<Record<string, string>>> {
  const content = await fs.readFile(filename)
  return parse(content, { columns: true }) as Array<Record<string, string>>
}
