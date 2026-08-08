// Payload shapes for the end-game reveal (mirror game.finalResults output).

export interface FinalBloc {
  name: string
  /** Claimed member countries (empty starting blocs render an empty state). */
  members: string[]
  /** Subset of members with no seated player (always empty in claimed-only math). */
  unclaimedMembers?: string[]
  size: number
  isBiggest: boolean
}

export interface FinalMission {
  slot: 'public' | 'private' | 'bonus'
  text: string
  /** Simplified Chinese mission text (falls back to English server-side). */
  textZh: string
  status: 'completed' | 'on_track' | 'at_risk' | 'failed'
  points: number
  overridden: boolean
}

export interface ScoreRow {
  rank: number
  country: string
  /** Simplified Chinese country name (from the server). */
  countryZh?: string
  flag: string
  dealPoints: number
  missionPoints: number
  adjustments: number
  total: number
  missions: FinalMission[]
}

export interface FinalDeal {
  id: number
  round: number
  initiatorCountry: string
  targetCountry: string
  status: string
  initiatorPoints: number | null
  targetPoints: number | null
}

export interface FinalResults {
  roomCode: string
  rounds: number
  /** The room's active roster (starting-bloc shift notes are scoped to it). */
  activeCountries: string[]
  blocs: FinalBloc[]
  winner: ScoreRow | null
  scoreboard: ScoreRow[]
  deals: FinalDeal[]
}
