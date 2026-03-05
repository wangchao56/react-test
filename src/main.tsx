import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { rootStore } from './store'
import { StoreProvider } from './store/StoreContext'
import './threestar.ts'

createRoot(document.getElementById('root')!).render(
    <StoreProvider store={rootStore}>
      <App />
    </StoreProvider>
)
