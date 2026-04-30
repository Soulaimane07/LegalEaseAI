import { useState } from 'react'
import './App.css'
import Landing from './pages/auth/Landing'
import {BrowserRouter, Routes, Route} from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<Landing />} />
        <Route path="/test" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
