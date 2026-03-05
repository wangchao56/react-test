import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'
import { Todo, Priority, isOverdue, isDueToday } from '../models/Todo'

export type FilterType = 'all' | 'active' | 'completed'
export type SortType = 'created' | 'priority' | 'dueDate' | 'title'

interface TodoState {
  todos: Todo[]
  filter: FilterType
  sortBy: SortType
  searchQuery: string
  selectedCategory: string
}

const initialState: TodoState = {
  todos: [],
  filter: 'all',
  sortBy: 'created',
  searchQuery: '',
  selectedCategory: '',
}

// 从 localStorage 加载
function loadFromLocalStorage(): TodoState {
  try {
    const stored = localStorage.getItem('todoStore')
    if (stored) {
      const data = JSON.parse(stored)
      return {
        ...initialState,
        ...data,
        todos: data.todos || [],
      }
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
  }
  return initialState
}

const todoSlice = createSlice({
  name: 'todos',
  initialState: loadFromLocalStorage(),
  reducers: {
    addTodo: (
      state,
      action: PayloadAction<{
        title: string
        description?: string
        priority?: Priority
        category?: string
        dueDate?: Date
      }>
    ) => {
      const id = `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const todo: Todo = {
        id,
        title: action.payload.title,
        description: action.payload.description || '',
        completed: false,
        priority: action.payload.priority || 'medium',
        category: action.payload.category || '',
        createdAt: new Date().toISOString(),
        dueDate: action.payload.dueDate ? action.payload.dueDate.toISOString() : null,
        tags: [],
      }
      state.todos.push(todo)
    },

    removeTodo: (state, action: PayloadAction<string>) => {
      state.todos = state.todos.filter((todo) => todo.id !== action.payload)
    },

    removeCompletedTodos: (state) => {
      state.todos = state.todos.filter((todo) => !todo.completed)
    },

    updateTodo: (
      state,
      action: PayloadAction<{
        id: string
        title?: string
        description?: string
        priority?: Priority
        category?: string
        dueDate?: Date | null
      }>
    ) => {
      const todo = state.todos.find((t) => t.id === action.payload.id)
      if (todo) {
        if (action.payload.title !== undefined) todo.title = action.payload.title
        if (action.payload.description !== undefined)
          todo.description = action.payload.description
        if (action.payload.priority !== undefined) todo.priority = action.payload.priority
        if (action.payload.category !== undefined) todo.category = action.payload.category
        if (action.payload.dueDate !== undefined) {
          todo.dueDate = action.payload.dueDate ? action.payload.dueDate.toISOString() : null
        }
      }
    },

    toggleTodo: (state, action: PayloadAction<string>) => {
      const todo = state.todos.find((t) => t.id === action.payload)
      if (todo) {
        todo.completed = !todo.completed
      }
    },

    toggleAll: (state) => {
      const allCompleted = state.todos.every((todo) => todo.completed)
      state.todos.forEach((todo) => {
        todo.completed = !allCompleted
      })
    },

    addTag: (state, action: PayloadAction<{ todoId: string; tag: string }>) => {
      const todo = state.todos.find((t) => t.id === action.payload.todoId)
      if (todo && !todo.tags.includes(action.payload.tag)) {
        todo.tags.push(action.payload.tag)
      }
    },

    removeTag: (state, action: PayloadAction<{ todoId: string; tag: string }>) => {
      const todo = state.todos.find((t) => t.id === action.payload.todoId)
      if (todo) {
        todo.tags = todo.tags.filter((tag) => tag !== action.payload.tag)
      }
    },

    setFilter: (state, action: PayloadAction<FilterType>) => {
      state.filter = action.payload
    },

    setSortBy: (state, action: PayloadAction<SortType>) => {
      state.sortBy = action.payload
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory =
        state.selectedCategory === action.payload ? '' : action.payload
    },
  },
})

export const {
  addTodo,
  removeTodo,
  removeCompletedTodos,
  updateTodo,
  toggleTodo,
  toggleAll,
  addTag,
  removeTag,
  setFilter,
  setSortBy,
  setSearchQuery,
  setSelectedCategory,
} = todoSlice.actions

// Selectors (计算属性)

// 过滤后的 todos
export const selectFilteredTodos = createSelector(
  [
    (state: { todos: TodoState }) => state.todos.todos,
    (state: { todos: TodoState }) => state.todos.filter,
    (state: { todos: TodoState }) => state.todos.searchQuery,
    (state: { todos: TodoState }) => state.todos.selectedCategory,
    (state: { todos: TodoState }) => state.todos.sortBy,
  ],
  (todos, filter, searchQuery, selectedCategory, sortBy) => {
    let filtered = todos.filter((todo) => {
      // 按状态过滤
      if (filter === 'active' && todo.completed) return false
      if (filter === 'completed' && !todo.completed) return false

      // 按搜索关键词过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = todo.title.toLowerCase().includes(query)
        const matchesDescription = todo.description.toLowerCase().includes(query)
        const matchesTags = todo.tags.some((tag) => tag.toLowerCase().includes(query))
        if (!matchesTitle && !matchesDescription && !matchesTags) return false
      }

      // 按分类过滤
      if (selectedCategory && todo.category !== selectedCategory) {
        return false
      }

      return true
    })

    // 排序
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }
)

// 统计信息
export const selectStatistics = createSelector(
  [(state: { todos: TodoState }) => state.todos.todos],
  (todos) => {
    const highPriority = todos.filter(
      (todo) => todo.priority === 'high' && !todo.completed
    ).length
    const overdue = todos.filter((todo) => isOverdue(todo)).length
    const dueToday = todos.filter((todo) => isDueToday(todo) && !todo.completed).length

    return {
      total: todos.length,
      active: todos.filter((todo) => !todo.completed).length,
      completed: todos.filter((todo) => todo.completed).length,
      highPriority,
      overdue,
      dueToday,
    }
  }
)

export const selectTodos = (state: { todos: TodoState }) => state.todos.todos
export const selectFilter = (state: { todos: TodoState }) => state.todos.filter
export const selectSortBy = (state: { todos: TodoState }) => state.todos.sortBy
export const selectSearchQuery = (state: { todos: TodoState }) => state.todos.searchQuery
export const selectSelectedCategory = (state: { todos: TodoState }) =>
  state.todos.selectedCategory
export const selectActiveTodosCount = (state: { todos: TodoState }) =>
  state.todos.todos.filter((todo) => !todo.completed).length
export const selectCompletedTodosCount = (state: { todos: TodoState }) =>
  state.todos.todos.filter((todo) => todo.completed).length
export const selectTotalTodosCount = (state: { todos: TodoState }) => state.todos.todos.length
export const selectCategories = (state: { todos: TodoState }) => {
  const categorySet = new Set<string>()
  state.todos.todos.forEach((todo) => {
    if (todo.category) {
      categorySet.add(todo.category)
    }
  })
  return Array.from(categorySet)
}
export const selectAllTags = (state: { todos: TodoState }) => {
  const tagSet = new Set<string>()
  state.todos.todos.forEach((todo) => {
    todo.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet)
}

export default todoSlice.reducer

