import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'

function App() {
  const whatsappUrl = 'https://wa.me/51987336132?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20RetoCert.'

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/inicio/comenzar/:examId" element={<HomePage />} />
        <Route path="/inicio/rendir/:examId" element={<HomePage />} />
        <Route path="/perfil" element={<HomePage />} />
        <Route path="/calificaciones" element={<HomePage />} />
        <Route path="/examenes" element={<HomePage />} />
        <Route path="/examenes/form" element={<HomePage />} />
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/home" element={<Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Enviar WhatsApp al +51 987 336 132"
        title="Escríbenos por WhatsApp"
        className="fixed bottom-4 right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-xl transition hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
          <path d="M20.52 3.48A11.8 11.8 0 0 0 12.12 0C5.5 0 .12 5.38.12 12c0 2.12.56 4.2 1.62 6.03L0 24l6.13-1.7a11.9 11.9 0 0 0 5.99 1.62h.01c6.62 0 12-5.38 12-12 0-3.2-1.25-6.2-3.61-8.44Zm-8.4 18.41h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.22-3.64 1.01.98-3.55-.24-.37A9.89 9.89 0 0 1 2.12 12c0-5.51 4.49-10 10-10 2.67 0 5.18 1.04 7.07 2.93A9.9 9.9 0 0 1 22.12 12c0 5.51-4.49 9.99-10 9.99Zm5.48-7.49c-.3-.15-1.77-.88-2.04-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.38-1.48-.88-.78-1.48-1.74-1.65-2.04-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.53.08-.8.38-.27.3-1.03 1.01-1.03 2.47s1.05 2.88 1.2 3.08c.15.2 2.06 3.14 4.99 4.41.7.3 1.24.48 1.66.62.7.22 1.33.19 1.83.11.56-.08 1.77-.72 2.02-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35Z" />
        </svg>
      </a>
    </BrowserRouter>
  )
}

export default App
