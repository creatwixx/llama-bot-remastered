import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiHealth, setApiHealth] = useState<string>('checking...')
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${apiUrl}/health`)
        const data = await response.json()
        setApiHealth(data.status === 'ok' ? '✅ Connected' : '❌ Error')
      } catch (error) {
        setApiHealth('❌ Failed to connect')
        console.error('Health check failed:', error)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 5000)
    return () => clearInterval(interval)
  }, [apiUrl])

  return (
    <div className="container">
      <h1>🦙 Llama Bot</h1>
      <div className="status">
        <p>API Status: <strong>{apiHealth}</strong></p>
        <p className="api-url">API URL: {apiUrl}</p>
      </div>
    </div>
  )
}

export default App

