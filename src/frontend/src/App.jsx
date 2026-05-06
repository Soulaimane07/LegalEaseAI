import './App.css'
import Landing from './pages/auth/Landing'
import Usecases from './pages/auth/Usecases'
import Conversation from './pages/site/Conversation'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/usecases" element={<Usecases />} />
        <Route path="/conversation/:userId" element={<Conversation />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
