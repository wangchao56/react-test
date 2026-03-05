import { configureStore } from '@reduxjs/toolkit'
import todoReducer from './stores/todoSlice'

export const store = configureStore({
  reducer: {
    todos: todoReducer,
  },
})

// 监听变化并保存到 localStorage
store.subscribe(() => {
  const state = store.getState()
  try {
    localStorage.setItem('todoStore', JSON.stringify(state.todos))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

