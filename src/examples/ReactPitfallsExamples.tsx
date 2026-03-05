/**
 * React 常见陷阱的示例代码
 * 包含错误示例和正确示例
 */

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'

// ============================================
// 陷阱 1: 状态更新的异步性
// ============================================

export function StateUpdateTrap() {
  const [count, setCount] = useState(0)

  // ❌ 错误：期望 count 立即更新
  const handleClickWrong = () => {
    setCount(count + 1)
    console.log(count) // ❌ 还是 0
    setCount(count + 1) // ❌ 只增加 1，不是 2
  }

  // ✅ 正确：使用函数式更新
  const handleClickCorrect = () => {
    setCount(prev => prev + 1)
    setCount(prev => prev + 1) // ✅ 会加 2
  }

  // ✅ 正确：使用 useEffect 获取最新值
  useEffect(() => {
    console.log('新的 count:', count)
  }, [count])

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClickWrong}>错误方式</button>
      <button onClick={handleClickCorrect}>正确方式</button>
    </div>
  )
}

// ============================================
// 陷阱 2: 闭包陷阱
// ============================================

export function ClosureTrap() {
  const [count, setCount] = useState(0)

  // ❌ 错误：闭包陷阱
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1) // ❌ count 永远是 0
    }, 1000)
    return () => clearInterval(timer)
  }, []) // ❌ 空依赖

  // ✅ 正确方式 1: 函数式更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => prev + 1) // ✅ 获取最新值
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // ✅ 正确方式 2: useRef
  const countRef = useRef(count)
  useEffect(() => {
    countRef.current = count
  }, [count])

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(countRef.current + 1) // ✅ 使用 ref
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return <div>Count: {count}</div>
}

// ============================================
// 陷阱 3: useEffect 依赖数组
// ============================================

export function DependencyTrap() {
  const [userId, setUserId] = useState(1)
  const [data, setData] = useState(null)

  // ❌ 错误 1: 缺少依赖
  useEffect(() => {
    fetch(`/api/user/${userId}`).then(setData) // ❌ userId 改变时不会重新请求
  }, []) // ❌ 缺少 userId

  // ❌ 错误 2: 对象依赖导致无限循环
  const [user, setUser] = useState({ id: 1, name: 'Alice' })

  useEffect(() => {
    fetch(`/api/user/${user.id}`)
  }, [user]) // ❌ 每次渲染 user 都是新对象

  // ✅ 正确：只依赖需要的属性
  useEffect(() => {
    fetch(`/api/user/${user.id}`)
  }, [user.id]) // ✅ 只依赖 id

  // ✅ 正确：函数使用 useCallback
  const fetchData = useCallback(async () => {
    const data = await fetch(`/api/user/${userId}`).then(r => r.json())
    setData(data)
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return <div>User Data: {JSON.stringify(data)}</div>
}

// ============================================
// 陷阱 4: useMemo/useCallback 误用
// ============================================

export function MemoizationTrap() {
  const [count, setCount] = useState(0)

  // ❌ 错误：过度优化
  const value = useMemo(() => count + 1, [count]) // ❌ 简单计算不需要

  // ✅ 正确：直接计算
  const value2 = count + 1

  // ❌ 错误：缺少依赖
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('all')

  const filteredTodos = useMemo(() => {
    return todos.filter(t => t.completed === filter)
  }, [todos]) // ❌ 缺少 filter

  // ✅ 正确：包含所有依赖
  const filteredTodos2 = useMemo(() => {
    return todos.filter(t => t.completed === filter)
  }, [todos, filter])

  return <div>Value: {value2}</div>
}

// ============================================
// 陷阱 5: 列表渲染 key
// ============================================

export function ListKeyTrap() {
  const [todos, setTodos] = useState([
    { id: 1, title: 'Todo 1' },
    { id: 2, title: 'Todo 2' },
  ])

  // ❌ 错误 1: 使用索引（可排序时有问题）
  const wrongList = todos.map((todo, index) => (
    <div key={index}>{todo.title}</div> // ❌
  ))

  // ❌ 错误 2: 不稳定的 key
  const wrongList2 = todos.map(todo => (
    <div key={Math.random()}>{todo.title}</div> // ❌
  ))

  // ✅ 正确：使用唯一且稳定的 ID
  const correctList = todos.map(todo => (
    <div key={todo.id}>{todo.title}</div> // ✅
  ))

  return <div>{correctList}</div>
}

// ============================================
// 陷阱 6: 条件渲染
// ============================================

export function ConditionalRenderTrap() {
  const count = 0

  // ❌ 错误：0 会被渲染
  return (
    <div>
      {count && <span>有 {count} 条消息</span>}
      {/* 渲染结果：<div>0</div> ❌ */}
    </div>
  )

  // ✅ 正确方式 1
  return (
    <div>
      {count > 0 && <span>有 {count} 条消息</span>}
    </div>
  )

  // ✅ 正确方式 2
  return (
    <div>
      {count ? <span>有 {count} 条消息</span> : null}
    </div>
  )
}

// ============================================
// 陷阱 7: 内存泄漏
// ============================================

export function MemoryLeakTrap() {
  const [data, setData] = useState(null)

  // ❌ 错误：未清理异步操作
  useEffect(() => {
    let mounted = true

    async function fetchData() {
      const result = await fetch('/api/data').then(r => r.json())
      
      // ❌ 如果组件已卸载，setData 会警告
      setData(result)
      
      // ✅ 正确：检查组件是否还在挂载
      if (mounted) {
        setData(result)
      }
    }

    fetchData()

    return () => {
      mounted = false // ✅ 标记为未挂载
    }
  }, [])

  // ✅ 使用 AbortController
  useEffect(() => {
    const abortController = new AbortController()

    async function fetchData() {
      try {
        const result = await fetch('/api/data', {
          signal: abortController.signal,
        }).then(r => r.json())
        setData(result)
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(error)
        }
      }
    }

    fetchData()

    return () => {
      abortController.abort() // ✅ 取消请求
    }
  }, [])

  return <div>Data: {JSON.stringify(data)}</div>
}

// ============================================
// 陷阱 8: 不必要的重新渲染
// ============================================

export function ReRenderTrap() {
  // ❌ 错误：每次渲染都创建新对象
  const config = { theme: 'dark' } // ❌

  // ✅ 正确：使用 useMemo
  const config2 = useMemo(() => ({ theme: 'dark' }), [])

  // ❌ 错误：内联函数
  const handleClick = () => console.log('clicked')

  return (
    <div>
      {/* ❌ 每次渲染都创建新函数 */}
      <Child onClick={() => handleClick()} />

      {/* ✅ 使用 useCallback */}
      <Child onClick={handleClick} />
    </div>
  )
}

// ============================================
// 陷阱 9: Context 值不稳定
// ============================================

import { createContext, useContext } from 'react'

interface ThemeContextType {
  theme: string
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

// ❌ 错误：每次渲染都创建新对象
export function ThemeProviderWrong({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('dark')

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

// ✅ 正确：稳定引用
export function ThemeProviderCorrect({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('dark')

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

// ============================================
// 陷阱 10: 事件处理中的立即执行
// ============================================

export function EventHandlerTrap() {
  const handleDelete = (id: string) => {
    console.log('Delete:', id)
  }

  // ❌ 错误：立即执行
  return <button onClick={handleDelete('123')}>Delete</button>
  // handleDelete('123') 会在渲染时立即执行！

  // ✅ 正确：箭头函数
  return <button onClick={() => handleDelete('123')}>Delete</button>

  // ✅ 正确：bind
  return <button onClick={handleDelete.bind(null, '123')}>Delete</button>
}

// ============================================
// 完整的正确示例
// ============================================

interface Todo {
  id: string
  title: string
  completed: boolean
}

export function CorrectTodoListExample() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const abortControllerRef = useRef<AbortController | null>(null)

  // ✅ 使用 useCallback 稳定函数引用
  const handleAddTodo = useCallback((title: string) => {
    setTodos(prev => [
      ...prev,
      { id: Date.now().toString(), title, completed: false },
    ])
  }, [])

  const handleToggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }, [])

  // ✅ 使用 useMemo 计算过滤后的列表
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.completed)
      case 'completed':
        return todos.filter(t => t.completed)
      default:
        return todos
    }
  }, [todos, filter])

  // ✅ 正确清理异步操作
  useEffect(() => {
    abortControllerRef.current = new AbortController()

    async function fetchTodos() {
      try {
        const response = await fetch('/api/todos', {
          signal: abortControllerRef.current?.signal,
        })
        const data = await response.json()
        setTodos(data)
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch todos:', error)
        }
      }
    }

    fetchTodos()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return (
    <div>
      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>
      <ul>
        {/* ✅ 使用稳定的 key */}
        {filteredTodos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggleTodo(todo.id)} // ✅ 使用回调
            />
            {todo.title}
          </li>
        ))}
      </ul>
    </div>
  )
}

