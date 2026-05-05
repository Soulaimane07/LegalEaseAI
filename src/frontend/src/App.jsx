import './App.css'
import Landing from './pages/auth/Landing'
import Conversation from './pages/site/Conversation'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/conversation/:userId" element={<Conversation />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
