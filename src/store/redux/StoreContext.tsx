/**
 * Redux Toolkit Store Context
 * 提供与 MST 相同的 Context API，并处理响应式更新
 */

import { ReactNode, useMemo } from 'react'
import { Provider as ReduxProvider, useSelector, useDispatch } from 'react-redux'
import { store, RootState } from './index'
import { TodoProxy } from './TodoAdapter'
import type { TodoStoreType } from './TodoAdapter'
import * as todoSelectors from './stores/todoSlice'
import {
  addTodo as addTodoAction,
  removeTodo,
  removeCompletedTodos,
  setFilter,
  setSortBy,
  setSearchQuery,
  setSelectedCategory,
  toggleAll,
} from './stores/todoSlice'
import type { Priority } from './models/Todo'

// StoreContext 不再需要，但保留用于类型兼容

// 响应式的 store hook，自动订阅 Redux 状态变化
export const useStore = () => {
  const dispatch = useDispatch()
  const reduxState = useSelector((state: RootState) => state)

  // 创建一个响应式的 store 对象
  const reactiveStore = useMemo(() => {
    const storeProxy = {
      // Actions
      addTodo: (
        title: string,
        description?: string,
        priority?: Priority,
        category?: string,
        dueDate?: Date
      ) => {
        dispatch(
          addTodoAction({
            title,
            description,
            priority,
            category,
            dueDate,
          })
        )
        const state = store.getState()
        const todo = state.todos.todos[state.todos.todos.length - 1]
        return new TodoProxy(todo, store)
      },
      removeTodo: (id: string) => {
        dispatch(removeTodo(id))
      },
      removeCompletedTodos: () => dispatch(removeCompletedTodos()),
      setFilter: (filter: 'all' | 'active' | 'completed') =>
        dispatch(setFilter(filter)),
      setSortBy: (sortBy: 'created' | 'priority' | 'dueDate' | 'title') =>
        dispatch(setSortBy(sortBy)),
      setSearchQuery: (query: string) => dispatch(setSearchQuery(query)),
      setSelectedCategory: (category: string) =>
        dispatch(setSelectedCategory(category)),
      toggleAll: () => dispatch(toggleAll()),

      // Getters - 从 Redux selectors 获取，自动响应更新
      get todos() {
        return todoSelectors.selectTodos(reduxState).map((todo) => {
          return new TodoProxy(todo, store)
        })
      },
      get filteredTodos() {
        return todoSelectors.selectFilteredTodos(reduxState).map((todo) => {
          return new TodoProxy(todo, store)
        })
      },
      get filter() {
        return todoSelectors.selectFilter(reduxState)
      },
      get sortBy() {
        return todoSelectors.selectSortBy(reduxState)
      },
      get searchQuery() {
        return todoSelectors.selectSearchQuery(reduxState)
      },
      get selectedCategory() {
        return todoSelectors.selectSelectedCategory(reduxState)
      },
      get activeTodosCount() {
        return todoSelectors.selectActiveTodosCount(reduxState)
      },
      get completedTodosCount() {
        return todoSelectors.selectCompletedTodosCount(reduxState)
      },
      get totalTodosCount() {
        return todoSelectors.selectTotalTodosCount(reduxState)
      },
      get categories() {
        return todoSelectors.selectCategories(reduxState)
      },
      get allTags() {
        return todoSelectors.selectAllTags(reduxState)
      },
      get statistics() {
        return todoSelectors.selectStatistics(reduxState)
      },
      saveToLocalStorage: () => {},
      loadFromLocalStorage: () => {},
    }

    return storeProxy as unknown as TodoStoreType
  }, [reduxState, dispatch])

  return reactiveStore
}

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  return <ReduxProvider store={store}>{children}</ReduxProvider>
}

// 导出类型（兼容 MST 的导出）
export type RootStore = ReturnType<typeof useStore>

