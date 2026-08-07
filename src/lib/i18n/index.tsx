/**
 * App-wide language infrastructure (English / 简体中文).
 *
 * Usage for page agents:
 *   import { useLang, useStrings, LangToggle } from '@/lib/i18n'
 *   import { sharedStrings, activityMessage, countryName } from '@/lib/i18n/shared'
 *
 *   const { lang, setLang } = useLang()
 *   const t = useStrings(sharedStrings)        // t.send, t.status.completed, …
 *   const dict = useStrings({ en: {...}, zh: {...} })  // per-page dictionaries
 *   activityMessage(row.kind, row.params, lang) ?? row.message
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Lang } from '@contracts/game-data'

export type Language = Lang

const STORAGE_KEY = 'summit:lang'

function loadInitialLang(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'zh' ? 'zh' : 'en'
  } catch {
    return 'en'
  }
}

interface LangContextValue {
  lang: Language
  setLang: (lang: Language) => void
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
})

/** Wraps the app (src/main.tsx). Persists the choice in localStorage. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(loadInitialLang)
  const setLang = useCallback((next: Language) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // private mode etc. — language just won't persist
    }
  }, [])
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  return useContext(LangContext)
}

/**
 * Pick the active branch of a `{ en, zh }` dictionary.
 * Works with sharedStrings or any per-page dictionary of the same shape.
 */
export function useStrings<T>(dict: { en: T; zh: T }): T {
  const { lang } = useLang()
  return dict[lang]
}

/** Small "EN | 中文" pill; active segment is gold. */
export function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang()
  const options: { value: Language; label: string }[] = [
    { value: 'en', label: 'EN' },
    { value: 'zh', label: '中文' },
  ]
  return (
    <div
      role="group"
      aria-label="Language / 语言"
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border border-hairline bg-paper p-0.5 ${className}`}
    >
      {options.map((opt) => {
        const active = lang === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => setLang(opt.value)}
            className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold tracking-wide transition-colors ${
              active
                ? 'bg-gold-soft text-gold-ink'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
