/**
 * Redux Toolkit Store 的适配器层
 * 提供与 MST 相同的 API，让组件无需修改
 */

import { store } from './index'
import {
  addTodo as addTodoAction,
  removeTodo as removeTodoAction,
  removeCompletedTodos as removeCompletedTodosAction,
  updateTodo as updateTodoAction,
  toggleTodo as toggleTodoAction,
  toggleAll as toggleAllAction,
  addTag as addTagAction,
  removeTag as removeTagAction,
  setFilter as setFilterAction,
  setSortBy as setSortByAction,
  setSearchQuery as setSearchQueryAction,
  setSelectedCategory as setSelectedCategoryAction,
  selectFilteredTodos,
  selectStatistics,
  selectFilter,
  selectSortBy,
  selectSearchQuery,
  selectSelectedCategory,
  selectActiveTodosCount,
  selectCompletedTodosCount,
  selectTotalTodosCount,
  selectCategories,
  selectAllTags,
} from './stores/todoSlice'
import { Todo, Priority, isOverdue, isDueToday } from './models/Todo'

type StoreType = typeof store

// Todo 对象的代理，提供 MST 风格的 API
export class TodoProxy {
  private todo: Todo
  private storeInstance: StoreType
  
  constructor(todo: Todo, storeInstance: StoreType) {
    this.todo = todo
    this.storeInstance = storeInstance
  }

  get id() {
    return this.currentTodo.id
  }
  get title() {
    return this.currentTodo.title
  }
  get description() {
    return this.currentTodo.description
  }
  get completed() {
    return this.currentTodo.completed
  }
  get priority() {
    return this.currentTodo.priority
  }
  get category() {
    return this.currentTodo.category
  }
  get createdAt() {
    return new Date(this.currentTodo.createdAt)
  }
  get dueDate() {
    return this.currentTodo.dueDate ? new Date(this.currentTodo.dueDate) : null
  }
  get tags() {
    return [...this.currentTodo.tags]
  }
  get isOverdue() {
    return isOverdue(this.currentTodo)
  }
  get isDueToday() {
    return isDueToday(this.currentTodo)
  }

  toggle() {
    this.storeInstance.dispatch(toggleTodoAction(this.todo.id))
    this.refresh()
  }

  updateTitle(newTitle: string) {
    this.storeInstance.dispatch(updateTodoAction({ id: this.todo.id, title: newTitle }))
    this.refresh()
  }

  updateDescription(newDescription: string) {
    this.storeInstance.dispatch(
      updateTodoAction({ id: this.todo.id, description: newDescription })
    )
    this.refresh()
  }

  setPriority(priority: Priority) {
    this.storeInstance.dispatch(updateTodoAction({ id: this.todo.id, priority }))
    this.refresh()
  }

  setCategory(category: string) {
    this.storeInstance.dispatch(updateTodoAction({ id: this.todo.id, category }))
    this.refresh()
  }

  setDueDate(date: Date | null) {
    this.storeInstance.dispatch(updateTodoAction({ id: this.todo.id, dueDate: date }))
    this.refresh()
  }

  addTag(tag: string) {
    this.storeInstance.dispatch(addTagAction({ todoId: this.todo.id, tag }))
    this.refresh()
  }

  removeTag(tag: string) {
    this.storeInstance.dispatch(removeTagAction({ todoId: this.todo.id, tag }))
    this.refresh()
  }

  // 刷新 todo 数据（从 store 获取最新）
  refresh() {
    const state = this.storeInstance.getState()
    const updated = state.todos.todos.find((t: Todo) => t.id === this.todo.id)
    if (updated) {
      this.todo = updated
    }
  }
  
  // 获取最新的 todo 数据
  getLatestTodo() {
    const state = this.storeInstance.getState()
    return state.todos.todos.find((t: Todo) => t.id === this.todo.id) || this.todo
  }
  
  // 在访问属性时获取最新数据
  private get currentTodo() {
    return this.getLatestTodo()
  }
}

// Store 适配器，提供 MST 风格的 API
class TodoStoreAdapter {
  private storeInstance: StoreType
  
  constructor(storeInstance: StoreType) {
    this.storeInstance = storeInstance
  }

  // Actions
  addTodo(
    title: string,
    description?: string,
    priority?: Priority,
    category?: string,
    dueDate?: Date
  ) {
    this.storeInstance.dispatch(
      addTodoAction({
        title,
        description,
        priority,
        category,
        dueDate,
      })
    )
    // 返回新创建的 todo
    const state = this.storeInstance.getState()
    const todo = state.todos.todos[state.todos.todos.length - 1]
    return new TodoProxy(todo, this.storeInstance)
  }

  removeTodo(id: string) {
    this.storeInstance.dispatch(removeTodoAction(id))
  }

  removeCompletedTodos() {
    this.storeInstance.dispatch(removeCompletedTodosAction())
  }

  setFilter(filter: 'all' | 'active' | 'completed') {
    this.storeInstance.dispatch(setFilterAction(filter))
  }

  setSortBy(sortBy: 'created' | 'priority' | 'dueDate' | 'title') {
    this.storeInstance.dispatch(setSortByAction(sortBy))
  }

  setSearchQuery(query: string) {
    this.storeInstance.dispatch(setSearchQueryAction(query))
  }

  setSelectedCategory(category: string) {
    this.storeInstance.dispatch(setSelectedCategoryAction(category))
  }

  toggleAll() {
    this.storeInstance.dispatch(toggleAllAction())
  }

  // Getters (计算属性)
  get todos() {
    const state = this.storeInstance.getState()
    return state.todos.todos.map((todo: Todo) => new TodoProxy(todo, this.storeInstance))
  }

  get filteredTodos() {
    const state = this.storeInstance.getState()
    return selectFilteredTodos(state).map((todo: Todo) => new TodoProxy(todo, this.storeInstance))
  }

  get filter() {
    return selectFilter(this.storeInstance.getState())
  }

  get sortBy() {
    return selectSortBy(this.storeInstance.getState())
  }

  get searchQuery() {
    return selectSearchQuery(this.storeInstance.getState())
  }

  get selectedCategory() {
    return selectSelectedCategory(this.storeInstance.getState())
  }

  get activeTodosCount() {
    return selectActiveTodosCount(this.storeInstance.getState())
  }

  get completedTodosCount() {
    return selectCompletedTodosCount(this.storeInstance.getState())
  }

  get totalTodosCount() {
    return selectTotalTodosCount(this.storeInstance.getState())
  }

  get categories() {
    return selectCategories(this.storeInstance.getState())
  }

  get allTags() {
    return selectAllTags(this.storeInstance.getState())
  }

  get statistics() {
    return selectStatistics(this.storeInstance.getState())
  }

  // localStorage 方法（保持兼容）
  saveToLocalStorage() {
    // 已经在 store.subscribe 中自动保存
  }

  loadFromLocalStorage() {
    // 已经在初始化时加载
  }
}

// 创建适配器实例
export const todoStoreAdapter = new TodoStoreAdapter(store)

// 导出类型（兼容 MST 的类型）
export type TodoType = TodoProxy
export type TodoStoreType = TodoStoreAdapter

// 导出适配器类（如果需要）
export { TodoStoreAdapter }

