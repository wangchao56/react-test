import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useStore } from '../store/StoreContext'
import { TodoItem, TodoItemMST } from './TodoItem'
import { TodoForm } from './TodoForm'
import { TodoFilters, TodoFiltersMST } from './TodoFilters'
import './TodoList.css'

// 基础组件（不带 observer，用于 Redux Toolkit）
export const TodoList = () => {
  const store = useStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<string | null>(null)

  const handleAddTodo = (
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high',
    category: string,
    dueDate?: Date
  ) => {
    store.addTodo(title, description, priority, category, dueDate)
    setIsFormOpen(false)
  }

  const handleEditTodo = (
    id: string,
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high',
    category: string,
    dueDate?: Date
  ) => {
    const todo = store.todos.find((t) => t.id === id)
    if (todo) {
      todo.updateTitle(title)
      todo.updateDescription(description)
      todo.setPriority(priority)
      todo.setCategory(category)
      todo.setDueDate(dueDate || null)
    }
    setEditingTodo(null)
  }

  const handleDeleteTodo = (id: string) => {
    store.removeTodo(id)
  }

  const stats = store.statistics

  return (
    <div className="todo-list-container">
      <div className="todo-header">
        <h1>📝 Todo List</h1>
        <div className="todo-stats">
          <div className="stat-item">
            <span className="stat-label">总计:</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">待办:</span>
            <span className="stat-value">{stats.active}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">完成:</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
          {stats.highPriority > 0 && (
            <div className="stat-item stat-high-priority">
              <span className="stat-label">高优先级:</span>
              <span className="stat-value">{stats.highPriority}</span>
            </div>
          )}
          {stats.overdue > 0 && (
            <div className="stat-item stat-overdue">
              <span className="stat-label">逾期:</span>
              <span className="stat-value">{stats.overdue}</span>
            </div>
          )}
          {stats.dueToday > 0 && (
            <div className="stat-item stat-due-today">
              <span className="stat-label">今日到期:</span>
              <span className="stat-value">{stats.dueToday}</span>
            </div>
          )}
        </div>
      </div>

      <TodoFilters />

      <div className="todo-actions">
        <button
          className="btn btn-primary"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          {isFormOpen ? '取消' : '+ 添加任务'}
        </button>
        {store.completedTodosCount > 0 && (
          <button
            className="btn btn-secondary"
            onClick={() => store.removeCompletedTodos()}
          >
            清除已完成 ({store.completedTodosCount})
          </button>
        )}
        {store.totalTodosCount > 0 && (
          <button className="btn btn-secondary" onClick={() => store.toggleAll()}>
            {store.activeTodosCount === 0 ? '取消全选' : '全部完成'}
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="todo-form-container">
          <TodoForm
            onSubmit={handleAddTodo}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      )}

      <div className="todo-list">
        {store.filteredTodos.length === 0 ? (
          <div className="todo-empty">
            {store.totalTodosCount === 0
              ? '📭 还没有任务，添加一个开始吧！'
              : '🔍 没有找到匹配的任务'}
          </div>
        ) : (
          store.filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isEditing={editingTodo === todo.id}
              onEdit={() => setEditingTodo(todo.id)}
              onCancelEdit={() => setEditingTodo(null)}
              onSave={handleEditTodo}
              onDelete={handleDeleteTodo}
            />
          ))
        )}
      </div>
    </div>
  )
}

// MST 版本（带 observer，用于 MobX State Tree）
export const TodoListMST = observer(() => {
  const store = useStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<string | null>(null)

  const handleAddTodo = (
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high',
    category: string,
    dueDate?: Date
  ) => {
    store.addTodo(title, description, priority, category, dueDate)
    setIsFormOpen(false)
  }

  const handleEditTodo = (
    id: string,
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high',
    category: string,
    dueDate?: Date
  ) => {
    const todo = store.todos.find((t) => t.id === id)
    if (todo) {
      todo.updateTitle(title)
      todo.updateDescription(description)
      todo.setPriority(priority)
      todo.setCategory(category)
      todo.setDueDate(dueDate || null)
    }
    setEditingTodo(null)
  }

  const handleDeleteTodo = (id: string) => {
    store.removeTodo(id)
  }

  const stats = store.statistics

  // 使用 MobX 后，可以直接通过 store 访问 todo 数据，不需要 ref
  useEffect(() => {
    if (store.todos.length > 0) {
      setTimeout(() => {
        // 直接访问 store 中的 todo 数据
        console.log('First todo:', store.todos[0])
      }, 1000)
    }
  }, [store.todos.length])

  return (
    <div className="todo-list-container">
      <div className="todo-header">
        <h1>📝 Todo List</h1>
        <div className="todo-stats">
          <div className="stat-item">
            <span className="stat-label">总计:</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">待办:</span>
            <span className="stat-value">{stats.active}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">完成:</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
          {stats.highPriority > 0 && (
            <div className="stat-item stat-high-priority">
              <span className="stat-label">高优先级:</span>
              <span className="stat-value">{stats.highPriority}</span>
            </div>
          )}
          {stats.overdue > 0 && (
            <div className="stat-item stat-overdue">
              <span className="stat-label">逾期:</span>
              <span className="stat-value">{stats.overdue}</span>
            </div>
          )}
          {stats.dueToday > 0 && (
            <div className="stat-item stat-due-today">
              <span className="stat-label">今日到期:</span>
              <span className="stat-value">{stats.dueToday}</span>
            </div>
          )}
        </div>
      </div>

      <TodoFiltersMST />

      <div className="todo-actions">
        <button
          className="btn btn-primary"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          {isFormOpen ? '取消' : '+ 添加任务'}
        </button>
        {store.completedTodosCount > 0 && (
          <button
            className="btn btn-secondary"
            onClick={() => store.removeCompletedTodos()}
          >
            清除已完成 ({store.completedTodosCount})
          </button>
        )}
        {store.totalTodosCount > 0 && (
          <button className="btn btn-secondary" onClick={() => store.toggleAll()}>
            {store.activeTodosCount === 0 ? '取消全选' : '全部完成'}
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="todo-form-container">
          <TodoForm
            onSubmit={handleAddTodo}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      )}

      <div className="todo-list">
        {store.filteredTodos.length === 0 ? (
          <div className="todo-empty">
            {store.totalTodosCount === 0
              ? '📭 还没有任务，添加一个开始吧！'
              : '🔍 没有找到匹配的任务'}
          </div>
        ) : (
          store.filteredTodos.map((todo) => (
            <TodoItemMST
              key={todo.id}
              todo={todo}
              isEditing={editingTodo === todo.id}
              onEdit={() => setEditingTodo(todo.id)}
              onCancelEdit={() => setEditingTodo(null)}
              onSave={handleEditTodo}
              onDelete={handleDeleteTodo}
            />
          ))
        )}
      </div>
    </div>
  )
})