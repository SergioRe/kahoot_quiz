import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/perfil" element={<HomePage />} />
        <Route path="/calificaciones" element={<HomePage />} />
        <Route path="/examenes" element={<HomePage />} />
        <Route path="/examenes/form" element={<HomePage />} />
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/home" element={<Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
