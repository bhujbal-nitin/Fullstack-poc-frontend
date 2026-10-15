import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { startAuthRefreshLoop, installAuthRefreshInterceptor } from './utils/authRefresh'

installAuthRefreshInterceptor()
startAuthRefreshLoop()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
