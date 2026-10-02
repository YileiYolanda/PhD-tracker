import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Materials from './pages/Materials'
import Outreach from './pages/Outreach'
import ProfessorProfiles from './pages/ProfessorProfiles'
import Interviews from './pages/Interviews'
import Documents from './pages/Documents'
import Recommenders from './pages/Recommenders'
import Tiers from './pages/Tiers'
import OnHold from './pages/OnHold'
import CloudGate from './components/CloudGate'

function App() {
  return (
    <CloudGate><Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/outreach" element={<Outreach />} />
        <Route path="/professors" element={<ProfessorProfiles />} />
        <Route path="/interviews" element={<Interviews />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/recommenders" element={<Recommenders />} />
        <Route path="/tiers" element={<Tiers />} />
        <Route path="/on-hold" element={<OnHold />} />
      </Routes>
    </Layout></CloudGate>
  )
}

export default App
