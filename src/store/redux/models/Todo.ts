// Redux Toolkit 版本的 Todo 类型和工具函数

export type Priority = 'low' | 'medium' | 'high'

export interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: Priority
  category: string
  createdAt: string // ISO 字符串格式
  dueDate: string | null // ISO 字符串格式
  tags: string[]
}

// 工具函数：计算是否逾期
export function isOverdue(todo: Todo): boolean {
  if (!todo.dueDate || todo.completed) return false
  return new Date() > new Date(todo.dueDate)
}

// 工具函数：计算是否今天到期
export function isDueToday(todo: Todo): boolean {
  if (!todo.dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(todo.dueDate)
  due.setHours(0, 0, 0, 0)
  return today.getTime() === due.getTime()
}

// 创建 Todo 对象
export function createTodo(
  id: string,
  title: string,
  description: string = '',
  priority: Priority = 'medium',
  category: string = '',
  dueDate: Date | null = null
): Todo {
  return {
    id,
    title,
    description,
    completed: false,
    priority,
    category,
    createdAt: new Date().toISOString(),
    dueDate: dueDate ? dueDate.toISOString() : null,
    tags: [],
  }
}

