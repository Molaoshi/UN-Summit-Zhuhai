// Room-code based session storage (no accounts / OAuth in this app).
export interface SummitSession {
  token: string
  roomCode: string
  role: 'student' | 'teacher'
  name?: string
  country?: string
  flag?: string
}

const KEY = 'summit:session'

export function saveSession(session: SummitSession) {
  localStorage.setItem(KEY, JSON.stringify(session))
  localStorage.setItem('summit:token', session.token)
}

export function loadSession(): SummitSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SummitSession
    if (!parsed.token || !parsed.roomCode) return null
    return parsed
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(KEY)
  localStorage.removeItem('summit:token')
}
