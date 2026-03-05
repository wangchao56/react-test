import { createContext, useContext } from 'react'
import { RootStore } from './index'

export const StoreContext = createContext<RootStore | null>(null)

export const useStore = () => {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('useStore must be used within StoreProvider')
  }
  return store
}

export const StoreProvider = ({
  store,
  children,
}: {
  store: RootStore
  children: React.ReactNode
}) => {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

