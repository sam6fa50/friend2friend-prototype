import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// No StrictMode: the prototype relies on single-fire effects/timers
// (e.g. the chat auto-reply), so we mount once to match its behavior.
createRoot(document.getElementById('root')).render(<App />)
