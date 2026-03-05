import { types, flow, getSnapshot, applySnapshot, Instance } from 'mobx-state-tree'
import { TodoModel } from '../models/Todo'

export type FilterType = 'all' | 'active' | 'completed'
export type SortType = 'created' | 'priority' | 'dueDate' | 'title'

export const TodoStore = types
  .model('TodoStore', {
    todos: types.optional(types.array(TodoModel), []),
    filter: types.optional(
      types.enumeration('FilterType', ['all', 'active', 'completed']),
      'all'
    ),
    sortBy: types.optional(
      types.enumeration('SortType', ['created', 'priority', 'dueDate', 'title']),
      'created'
    ),
    searchQuery: types.optional(types.string, ''),
    selectedCategory: types.optional(types.string, ''),
  })
  .actions((self) => ({
    addTodo(
      title: string,
      description?: string,
      priority?: 'low' | 'medium' | 'high',
      category?: string,
      dueDate?: Date
    ) {
      const id = `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const todo = TodoModel.create({
        id,
        title,
        description: description || '',
        priority: priority || 'medium',
        category: category || '',
        dueDate: dueDate || null,
        completed: false,
        createdAt: new Date(),
        tags: [],
      })
      self.todos.push(todo)
      return todo
    },
    removeTodo(id: string) {
      const index = self.todos.findIndex((todo) => todo.id === id)
      if (index > -1) {
        self.todos.splice(index, 1)
      }
    },
    removeCompletedTodos() {
      self.todos.replace(self.todos.filter((todo) => !todo.completed))
    },
    setFilter(filter: FilterType) {
      self.filter = filter
    },
    setSortBy(sortBy: SortType) {
      self.sortBy = sortBy
    },
    setSearchQuery(query: string) {
      self.searchQuery = query
    },
    setSelectedCategory(category: string) {
      self.selectedCategory = category === self.selectedCategory ? '' : category
    },
    toggleAll() {
      const allCompleted = self.todos.every((todo) => todo.completed)
      self.todos.forEach((todo) => {
        todo.completed = !allCompleted
      })
    },
    // 保存到 localStorage
    saveToLocalStorage() {
      const snapshot = getSnapshot(self)
      localStorage.setItem('todoStore', JSON.stringify(snapshot))
    },
    // 从 localStorage 加载
    loadFromLocalStorage: flow(function* () {
      try {
        const stored = localStorage.getItem('todoStore')
        if (stored) {
          const snapshot = JSON.parse(stored)
          applySnapshot(self, snapshot)
        }
      } catch (error) {
        console.error('Failed to load from localStorage:', error)
      }
    }),
  }))
  .views((self) => ({
    get filteredTodos() {
      let filtered = self.todos.filter((todo) => {
        // 按状态过滤
        if (self.filter === 'active' && todo.completed) return false
        if (self.filter === 'completed' && !todo.completed) return false

        // 按搜索关键词过滤
        if (self.searchQuery) {
          const query = self.searchQuery.toLowerCase()
          const matchesTitle = todo.title.toLowerCase().includes(query)
          const matchesDescription = todo.description.toLowerCase().includes(query)
          const matchesTags = todo.tags.some((tag) =>
            tag.toLowerCase().includes(query)
          )
          if (!matchesTitle && !matchesDescription && !matchesTags) return false
        }

        // 按分类过滤
        if (self.selectedCategory && todo.category !== self.selectedCategory) {
          return false
        }

        return true
      })

      // 排序
      filtered = [...filtered].sort((a, b) => {
        switch (self.sortBy) {
          case 'priority':
            const priorityOrder = { high: 3, medium: 2, low: 1 }
            return priorityOrder[b.priority as 'high' | 'medium' | 'low'] - priorityOrder[a.priority as 'high' | 'medium' | 'low']
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) return 0
            if (!a.dueDate) return 1
            if (!b.dueDate) return -1
            return a.dueDate.getTime() - b.dueDate.getTime()
          case 'title':
            return a.title.localeCompare(b.title)
          case 'created':
          default:
            return b.createdAt.getTime() - a.createdAt.getTime()
        }
      })

      return filtered
    },
    get activeTodosCount() {
      return self.todos.filter((todo) => !todo.completed).length
    },
    get completedTodosCount() {
      return self.todos.filter((todo) => todo.completed).length
    },
    get totalTodosCount() {
      return self.todos.length
    },
    get categories() {
      const categorySet = new Set<string>()
      self.todos.forEach((todo) => {
        if (todo.category) {
          categorySet.add(todo.category)
        }
      })
      return Array.from(categorySet)
    },
    get allTags() {
      const tagSet = new Set<string>()
      self.todos.forEach((todo) => {
        todo.tags.forEach((tag) => tagSet.add(tag))
      })
      return Array.from(tagSet)
    },
    get statistics() {
      const highPriority = self.todos.filter(
        (todo) => todo.priority === 'high' && !todo.completed
      ).length
      const overdue = self.todos.filter((todo) => todo.isOverdue).length
      const dueToday = self.todos.filter((todo) => todo.isDueToday && !todo.completed)
        .length

      return {
        total: self.todos.length,
        active: self.todos.filter((todo) => !todo.completed).length,
        completed: self.todos.filter((todo) => todo.completed).length,
        highPriority,
        overdue,
        dueToday,
      }
    },
  }))

export type TodoStoreType = Instance<typeof TodoStore>

