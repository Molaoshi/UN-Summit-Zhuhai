// Payload shapes for the end-game reveal (mirror game.finalResults output).

export interface FinalBloc {
  name: string
  members: string[]
  size: number
  isBiggest: boolean
}

export interface FinalMission {
  slot: 'public' | 'private' | 'bonus'
  text: string
  status: 'completed' | 'on_track' | 'at_risk' | 'failed'
  points: number
  overridden: boolean
}

export interface ScoreRow {
  rank: number
  country: string
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
  blocs: FinalBloc[]
  winner: ScoreRow | null
  scoreboard: ScoreRow[]
  deals: FinalDeal[]
}
