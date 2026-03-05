/**
 * MST Model 与 useMemo 搭配使用的示例
 * 
 * 展示正确的和错误的使用方式
 */

import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { TodoType } from '../store/models/Todo'

interface Props {
  todo: TodoType
}

// ============================================
// 示例 1: ❌ 错误的 useMemo 使用
// ============================================
export const TodoItemWrong = observer(({ todo }: Props) => {
  const priorityColors = {
    high: '#ff4757',
    medium: '#ffa502',
    low: '#2ed573',
  }

  // ❌ 错误：依赖整个 todo 对象
  // 当 todo 的任何属性（title, description 等）变化时，都会重新计算
  // 即使 priority 没有变化
  const bgColor = useMemo(() => {
    console.log('重新计算 bgColor') // 这个会频繁触发
    return priorityColors[todo.priority]
  }, [todo]) // ❌ 依赖整个对象

  return <div style={{ backgroundColor: bgColor }}>{todo.title}</div>
})

// ============================================
// 示例 2: ✅ 正确的 useMemo 使用（精确依赖）
// ============================================
export const TodoItemCorrect1 = observer(({ todo }: Props) => {
  const priorityColors = {
    high: '#ff4757',
    medium: '#ffa502',
    low: '#2ed573',
  }

  // ✅ 正确：只依赖实际使用的属性
  // 只有当 todo.priority 变化时才会重新计算
  const bgColor = useMemo(() => {
    console.log('重新计算 bgColor') // 只有 priority 变化时才触发
    return priorityColors[todo.priority]
  }, [todo.priority]) // ✅ 精确依赖

  return <div style={{ backgroundColor: bgColor }}>{todo.title}</div>
})

// ============================================
// 示例 3: ✅ 更好的做法 - 直接计算（简单操作）
// ============================================
export const TodoItemCorrect2 = observer(({ todo }: Props) => {
  const priorityColors = {
    high: '#ff4757',
    medium: '#ffa502',
    low: '#2ed573',
  }

  // ✅ 对于简单操作，不需要 useMemo
  // observer 会自动追踪 todo.priority，只有它变化时才重新渲染
  const bgColor = priorityColors[todo.priority]

  return <div style={{ backgroundColor: bgColor }}>{todo.title}</div>
})

// ============================================
// 示例 4: ✅ 复杂计算 - 适合使用 useMemo
// ============================================
export const TodoItemComplex = observer(({ todo }: Props) => {
  // ✅ 复杂计算适合使用 useMemo
  const statusInfo = useMemo(() => {
    // 复杂的计算逻辑
    const info = {
      text: '',
      backgroundColor: '',
      borderColor: '',
      icon: '',
    }

    if (todo.isOverdue) {
      info.text = '已逾期'
      info.backgroundColor = '#fff5f5'
      info.borderColor = '#ff4757'
      info.icon = '⚠️'
    } else if (todo.isDueToday) {
      info.text = '今日到期'
      info.backgroundColor = '#fffbf0'
      info.borderColor = '#ffa502'
      info.icon = '⏰'
    } else if (todo.completed) {
      info.text = '已完成'
      info.backgroundColor = '#f0f9ff'
      info.borderColor = '#2ed573'
      info.icon = '✓'
    } else {
      info.text = '进行中'
      info.backgroundColor = '#ffffff'
      info.borderColor = '#e0e0e0'
      info.icon = '🔄'
    }

    return info
  }, [todo.isOverdue, todo.isDueToday, todo.completed]) // ✅ 依赖 computed 属性

  // ✅ 样式对象也适合用 useMemo
  const style = useMemo(
    () => ({
      backgroundColor: statusInfo.backgroundColor,
      borderLeft: `4px solid ${statusInfo.borderColor}`,
      padding: '1rem',
      borderRadius: '8px',
    }),
    [statusInfo.backgroundColor, statusInfo.borderColor]
  )

  return (
    <div style={style}>
      <span>{statusInfo.icon}</span>
      <span>{statusInfo.text}</span>
      <div>{todo.title}</div>
    </div>
  )
})

// ============================================
// 示例 5: ✅ 格式化显示 - 适合使用 useMemo
// ============================================
export const TodoItemFormatted = observer(({ todo }: Props) => {
  // ✅ 日期格式化等复杂操作适合用 useMemo
  const formattedDate = useMemo(() => {
    if (!todo.dueDate) return null

    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(todo.dueDate)
  }, [todo.dueDate]) // ✅ 只有日期变化时才重新格式化

  // ✅ 标签列表处理
  const tagList = useMemo(() => {
    if (todo.tags.length === 0) return null
    return todo.tags.map((tag, index) => (
      <span key={index} className="tag">
        #{tag}
      </span>
    ))
  }, [todo.tags]) // ✅ 依赖数组，注意 MST 的数组也是 observable

  return (
    <div>
      <h3>{todo.title}</h3>
      {formattedDate && <div>截止: {formattedDate}</div>}
      {tagList && <div className="tags">{tagList}</div>}
    </div>
  )
})

// ============================================
// 示例 6: ✅ 使用 MST 的 computed（推荐）
// ============================================
// 最佳实践：将复杂计算移到 MST model 的 views 中
// 这样所有组件都可以复用，且自动缓存

// 在 TodoModel 中添加：
// .views((self) => ({
//   get priorityColor() {
//     const colors = { high: '#ff4757', medium: '#ffa502', low: '#2ed573' }
//     return colors[self.priority]
//   },
//   get statusInfo() {
//     // 复杂的状态计算逻辑
//   }
// }))

export const TodoItemWithComputed = observer(({ todo }: Props) => {
  // ✅ 直接使用 MST 的 computed，不需要 useMemo
  // MST 的 views 已经提供了缓存机制
  // const bgColor = todo.priorityColor // 假设在 model 中定义了

  return <div>{todo.title}</div>
})

