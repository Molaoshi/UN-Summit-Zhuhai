// Shared game UI metadata: colors, icons, labels (design.md sections 2 & 10).
import { Atom, Leaf, Flame, Landmark, Shield, HardHat, Zap, Cpu } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type BlocKey = 'nuclear' | 'green' | 'fossil' | 'plum' | 'slate' | 'olive' | 'clay'

export const BLOCS: Record<BlocKey, { label: string; color: string; soft: string; icon: LucideIcon }> = {
  nuclear: { label: 'Nuclear Energy', color: '#B45A3C', soft: '#F2DFD5', icon: Atom },
  green: { label: 'Green Energy', color: '#5E7E58', soft: '#DFE8DA', icon: Leaf },
  fossil: { label: 'Fossil Fuel', color: '#8C6A3F', soft: '#EBE1CE', icon: Flame },
  // Custom (player-founded) blocs, assigned in this order
  plum: { label: 'Custom Bloc', color: '#7A5C6E', soft: '#EFE6EA', icon: Landmark },
  slate: { label: 'Custom Bloc', color: '#55707F', soft: '#E4EAED', icon: Landmark },
  olive: { label: 'Custom Bloc', color: '#7C7A4A', soft: '#EBEBE0', icon: Landmark },
  clay: { label: 'Custom Bloc', color: '#96604F', soft: '#EFE3DD', icon: Landmark },
}

export type DealType = 'military' | 'infrastructure' | 'energy' | 'technology'

export const DEAL_TYPES: Record<DealType, { label: string; asset: string; color: string; icon: LucideIcon }> = {
  military: { label: 'Military Protection', asset: 'Military', color: '#A8503C', icon: Shield },
  infrastructure: { label: 'Infrastructure', asset: 'Resources', color: '#8A6A45', icon: HardHat },
  energy: { label: 'Energy', asset: 'Energy', color: '#B98A2E', icon: Zap },
  technology: { label: 'Technology', asset: 'Tech', color: '#2E6E6A', icon: Cpu },
}

export type StatusKey = 'completed' | 'ontrack' | 'atrisk' | 'failed' | 'pending'

export const STATUSES: Record<StatusKey, { label: string; color: string; soft: string }> = {
  completed: { label: 'COMPLETED', color: '#4F7A52', soft: '#DDE8D9' },
  ontrack: { label: 'ON TRACK', color: '#2E6E6A', soft: '#D9E7E4' },
  atrisk: { label: 'AT RISK', color: '#B07E22', soft: '#F2E4C6' },
  failed: { label: 'FAILED', color: '#A94438', soft: '#F0DAD4' },
  pending: { label: 'PENDING', color: '#8B8F82', soft: '#E8E4D8' },
}
