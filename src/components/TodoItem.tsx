import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import { TodoType } from '../store/models/Todo'
import { TodoForm } from './TodoForm'
import './TodoItem.css'

interface TodoItemProps {
  todo: TodoType
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (
    id: string,
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high',
    category: string,
    dueDate?: Date
  ) => void
  onDelete: (id: string) => void
}

// 基础组件（不带 observer，用于 Redux Toolkit）
export const TodoItem = ({
  todo,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: TodoItemProps) => {
    const [newTag, setNewTag] = useState('')

    const priorityColors: Record<'low' | 'medium' | 'high', string> = {
      high: '#ff4757',
      medium: '#ffa502',
      low: '#2ed573',
    }

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && newTag.trim()) {
        todo.addTag(newTag.trim())
        setNewTag('')
      }
    }

    const handleRemoveTag = (tag: string) => {
      todo.removeTag(tag)
    }

    if (isEditing) {
      return (
        <div className="todo-item editing">
          <TodoForm
            initialTitle={todo.title}
            initialDescription={todo.description}
            initialPriority={todo.priority as 'low' | 'medium' | 'high' | undefined}
            initialCategory={todo.category}
            initialDueDate={todo.dueDate}
            onSubmit={(title, description, priority, category, dueDate) =>
              onSave(todo.id, title, description, priority, category, dueDate)
            }
            onCancel={onCancelEdit}
          />
        </div>
      )
    }

    // ✅ 正确的 useMemo 使用：依赖具体属性，而不是整个对象
    // 这样可以避免 todo 的其他属性（如 title, description）变化时重新计算
    const bgColor = useMemo(() => {
      return priorityColors[todo.priority as 'low' | 'medium' | 'high']
    }, [todo.priority]) // 只依赖 priority 属性

    return (
      <div
        className={`todo-item ${todo.completed ? 'completed' : ''} ${
          todo.isOverdue ? 'overdue' : ''
        } ${todo.isDueToday ? 'due-today' : ''}`}
      >
        <div className="todo-item-header">
          <div className="todo-checkbox">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => todo.toggle()}
              id={`todo-${todo.id}`}
            />
            <label htmlFor={`todo-${todo.id}`}></label>
          </div>
          <div className="todo-content">
            <div className="todo-title-wrapper">
              <h3 className="todo-title">{todo.title}</h3>
              <span
                className="todo-priority"
                style={{ backgroundColor: bgColor }}
              >
                {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
              </span>
            </div>
            {todo.description && (
              <p className="todo-description">{todo.description}</p>
            )}
            <div className="todo-meta">
              {todo.category && (
                <span className="todo-category">📁 {todo.category}</span>
              )}
              {todo.dueDate && (
                <span
                  className={`todo-due-date ${
                    todo.isOverdue ? 'overdue' : todo.isDueToday ? 'due-today' : ''
                  }`}
                >
                  📅 {todo.dueDate.toLocaleDateString('zh-CN')}
                  {todo.isOverdue && ' ⚠️ 已逾期'}
                  {todo.isDueToday && !todo.isOverdue && ' ⏰ 今天到期'}
                </span>
              )}
              <span className="todo-created">
                🕐 {todo.createdAt.toLocaleDateString('zh-CN')}
              </span>
            </div>
            {todo.tags.length > 0 && (
              <div className="todo-tags">
                {todo.tags.map((tag: string) => (
                  <span key={tag} className="todo-tag">
                    #{tag}
                    {!todo.completed && (
                      <button
                        className="tag-remove"
                        onClick={() => handleRemoveTag(tag)}
                        title="删除标签"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            {!todo.completed && (
              <div className="todo-tag-input">
                <input
                  type="text"
                  placeholder="添加标签 (按回车)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
            )}
          </div>
        </div>
        <div className="todo-actions">
          {!todo.completed && (
            <button className="btn-icon" onClick={onEdit} title="编辑">
              ✏️
            </button>
          )}
          <button
            className="btn-icon"
            onClick={() => onDelete(todo.id)}
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    )
}

// MST 版本（带 observer，用于 MobX State Tree）
export const TodoItemMST = observer(TodoItem)

