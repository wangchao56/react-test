# MST Model 状态与 React useMemo Hook 搭配使用指南

## 核心概念

### 1. MST 的响应式机制

MST (MobX State Tree) 使用 MobX 的响应式系统：
- **自动追踪依赖**：使用 `observer` 包装的组件会自动追踪访问的 observable 属性
- **细粒度更新**：只有实际使用的属性变化时才会触发重新渲染
- **计算属性缓存**：MST 的 `views` (computed) 会自动缓存，只有依赖变化时才重新计算

### 2. observer 的工作原理

```tsx
import { observer } from 'mobx-react-lite'

// observer 会自动追踪组件内访问的所有 observable 属性
export const TodoItem = observer(({ todo }) => {
  // 访问 todo.priority 会被自动追踪
  // 当 todo.priority 变化时，组件会重新渲染
  return <div>{todo.priority}</div>
})
```

## useMemo 的使用场景

### ✅ 场景 1: 需要使用，但依赖项要精确

**问题示例**（你代码中的问题）：
```tsx
// ❌ 错误：依赖整个 todo 对象
const bgColor = useMemo(() => {
  return priorityColors[todo.priority]
}, [todo]) // todo 对象的任何属性变化都会重新计算
```

**正确做法**：
```tsx
// ✅ 正确：只依赖实际使用的属性
const bgColor = useMemo(() => {
  return priorityColors[todo.priority]
}, [todo.priority]) // 只有 priority 变化时才重新计算
```

**为什么需要 useMemo？**
- 即使 `todo.priority` 没变，如果 `todo.title` 变了，整个组件会重新渲染
- 但 `bgColor` 的计算结果不变，使用 `useMemo` 可以避免重复计算
- 注意：这是**可选优化**，因为 MST 的 views 已经做了缓存

### ✅ 场景 2: 复杂计算或派生数据

```tsx
export const TodoItem = observer(({ todo }) => {
  // ✅ 复杂计算适合用 useMemo
  const formattedDate = useMemo(() => {
    if (!todo.dueDate) return null
    // 复杂的时间格式化逻辑
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(todo.dueDate)
  }, [todo.dueDate]) // 只有 dueDate 变化时才重新格式化

  return <div>截止时间: {formattedDate}</div>
})
```

### ✅ 场景 3: 过滤、映射等数组操作

```tsx
export const TodoList = observer(() => {
  const store = useStore()
  
  // ✅ 数组操作适合用 useMemo
  const highPriorityTodos = useMemo(() => {
    return store.filteredTodos.filter(t => t.priority === 'high')
  }, [store.filteredTodos]) // 依赖计算属性

  return (
    <div>
      {highPriorityTodos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
    </div>
  )
})
```

### ❌ 场景 4: 不需要 useMemo 的情况

**情况 A: 直接使用 MST 的 computed (views)**
```tsx
// ❌ 不需要，因为 store.filteredTodos 已经是 computed
const todos = useMemo(() => store.filteredTodos, [store.filteredTodos])

// ✅ 直接使用即可
const todos = store.filteredTodos
```

**情况 B: 简单的属性访问**
```tsx
// ❌ 过度优化，不需要
const title = useMemo(() => todo.title, [todo.title])

// ✅ 直接使用
const title = todo.title
```

**情况 C: 依赖整个对象但只读一个属性**
```tsx
// ❌ 错误：依赖整个对象会导致不必要的重新计算
const color = useMemo(() => priorityColors[todo.priority], [todo])

// ✅ 正确：依赖具体属性
const color = useMemo(() => priorityColors[todo.priority], [todo.priority])

// ✅ 或者：直接计算（简单操作不需要 useMemo）
const color = priorityColors[todo.priority]
```

## 最佳实践

### 1. 优先使用 MST 的 views (computed)

```typescript
// ✅ 在 model 中定义 computed
export const TodoModel = types
  .model('Todo', {
    priority: types.enumeration('Priority', ['low', 'medium', 'high']),
  })
  .views((self) => ({
    get priorityColor() {
      const colors = { high: '#ff4757', medium: '#ffa502', low: '#2ed573' }
      return colors[self.priority]
    }
  }))

// 组件中直接使用，无需 useMemo
export const TodoItem = observer(({ todo }) => {
  return <div style={{ color: todo.priorityColor }}>{todo.title}</div>
})
```

### 2. useMemo 用于 React 特定的优化

```tsx
export const TodoItem = observer(({ todo }) => {
  // ✅ 用于 React 渲染相关的计算（如样式对象）
  const style = useMemo(() => ({
    backgroundColor: priorityColors[todo.priority],
    opacity: todo.completed ? 0.5 : 1
  }), [todo.priority, todo.completed])

  // ✅ 用于格式化显示（非 model 状态）
  const displayText = useMemo(() => {
    return todo.title.toUpperCase()
  }, [todo.title])

  return <div style={style}>{displayText}</div>
})
```

### 3. 避免在 useMemo 中修改 observable

```tsx
// ❌ 错误：不要在 useMemo 中修改 observable
const processedData = useMemo(() => {
  todo.someProperty = 'new value' // 这会导致响应式问题
  return process(todo)
}, [todo])

// ✅ 正确：只读取，不修改
const processedData = useMemo(() => {
  return process(todo.title, todo.priority) // 只读取属性
}, [todo.title, todo.priority])
```

## 实际示例对比

### 示例 1: 你当前代码的问题

```tsx
// 当前代码（有问题）
const bgColor = useMemo(() => {
  return priorityColors[todo.priority]
}, [todo]) // ❌ 依赖整个对象

// 修复方案 1: 精确依赖
const bgColor = useMemo(() => {
  return priorityColors[todo.priority]
}, [todo.priority]) // ✅ 只依赖 priority

// 修复方案 2: 移到 model 中（推荐）
// 在 TodoModel.views 中添加 get priorityColor()
const bgColor = todo.priorityColor // ✅ 使用 computed

// 修复方案 3: 直接计算（简单操作）
const bgColor = priorityColors[todo.priority] // ✅ 足够简单，不需要 useMemo
```

### 示例 2: 复杂计算的正确使用

```tsx
export const TodoItem = observer(({ todo }) => {
  // ✅ 复杂计算 + 精确依赖
  const statusInfo = useMemo(() => {
    const info = {
      text: '',
      color: '',
      icon: ''
    }
    
    if (todo.isOverdue) {
      info.text = '已逾期'
      info.color = '#ff4757'
      info.icon = '⚠️'
    } else if (todo.isDueToday) {
      info.text = '今日到期'
      info.color = '#ffa502'
      info.icon = '⏰'
    } else {
      info.text = '进行中'
      info.color = '#2ed573'
      info.icon = '✓'
    }
    
    return info
  }, [todo.isOverdue, todo.isDueToday]) // 依赖 computed 属性

  return (
    <div style={{ color: statusInfo.color }}>
      {statusInfo.icon} {statusInfo.text}
    </div>
  )
})
```

## 总结

1. **MST 的 computed (views) 已经提供了缓存**，不需要额外优化
2. **useMemo 主要用于**：
   - React 特定的计算（样式对象、格式化）
   - 复杂计算且需要精确控制依赖
   - 数组过滤/映射等操作
3. **useMemo 的依赖项要精确**：
   - ❌ `[todo]` - 依赖整个对象
   - ✅ `[todo.priority]` - 依赖具体属性
4. **简单操作不需要 useMemo**：
   - 直接属性访问
   - 简单的对象查找
5. **优先考虑在 MST model 中定义 computed**，而不是在组件中使用 useMemo

