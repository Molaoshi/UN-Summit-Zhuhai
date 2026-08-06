import { Routes, Route } from 'react-router'
import { TRPCProvider } from '@/providers/trpc'
import Home from '@/pages/Home'
import Lobby from '@/pages/Lobby'
import Play from '@/pages/Play'
import Admin from '@/pages/Admin'
import Endgame from '@/pages/Endgame'

export default function App() {
  return (
    <TRPCProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/play" element={<Play />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/endgame" element={<Endgame />} />
      </Routes>
    </TRPCProvider>
  )
}
