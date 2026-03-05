import { useState, useEffect } from 'react'
import './TodoForm.css'

interface TodoFormProps {
  initialTitle?: string
  initialDescription?: string
  initialPriority?: 'low' | 'medium' | 'high'
  initialCategory?: string
  initialDueDate?: Date | null
  onSubmit: (
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high',
    category: string,
    dueDate?: Date
  ) => void
  onCancel?: () => void
}

export const TodoForm = ({
  initialTitle = '',
  initialDescription = '',
  initialPriority = 'medium',
  initialCategory = '',
  initialDueDate = null,
  onSubmit,
  onCancel,
}: TodoFormProps) => {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initialPriority)
  const [category, setCategory] = useState(initialCategory)
  const [dueDate, setDueDate] = useState(
    initialDueDate ? initialDueDate.toISOString().split('T')[0] : ''
  )

  useEffect(() => {
    setTitle(initialTitle)
    setDescription(initialDescription)
    setPriority(initialPriority)
    setCategory(initialCategory)
    setDueDate(initialDueDate ? initialDueDate.toISOString().split('T')[0] : '')
  }, [initialTitle, initialDescription, initialPriority, initialCategory, initialDueDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const due = dueDate ? new Date(dueDate) : undefined
    onSubmit(title.trim(), description.trim(), priority, category.trim(), due)
    
    // 重置表单
    if (!initialTitle) {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setCategory('')
      setDueDate('')
    }
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">标题 *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="任务标题"
          required
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">描述</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="任务描述（可选）"
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="priority">优先级</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as 'low' | 'medium' | 'high')
            }
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="category">分类</label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="工作/学习/生活..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">截止日期</label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {initialTitle ? '保存' : '添加'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}

