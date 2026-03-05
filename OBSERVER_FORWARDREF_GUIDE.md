# observer 与 forwardRef 配合使用指南

## 问题说明

使用 `observer` 包裹的组件在使用 `forwardRef` 导出方法状态时，经常会遇到状态追踪失效的问题。本文档详细解释原因和解决方案。

---

## 🔍 核心问题

### 问题表现

```tsx
// ❌ 错误示例：状态追踪失效
const MyComponent = observer(
  forwardRef<MyRef, Props>((props, ref) => {
    const store = useStore()
    
    useImperativeHandle(ref, () => ({
      // ❌ 这个方法可能无法访问到最新的状态
      getState: () => {
        return store.todos // 可能返回过期的状态
      },
      updateState: () => {
        store.addTodo('test') // 可能不会触发响应式更新
      }
    }))
    
    return <div>{store.todos.length}</div>
  })
)
```

---

## 📚 原理分析

### 1. observer 的工作机制

`observer` HOC 的工作原理：

```tsx
// observer 内部实现（简化版）
function observer(component) {
  return function ObservedComponent(props) {
    // 1. 创建一个响应式上下文
    const reaction = new Reaction()
    
    // 2. 追踪组件渲染函数中对 observable 的访问
    const render = reaction.track(() => {
      return component(props)
    })
    
    // 3. 当追踪到的 observable 变化时，重新渲染
    // ...
  }
}
```

**关键点**：`observer` 需要在**组件渲染函数执行时**追踪 observable 的访问。

### 2. forwardRef 的结构

```tsx
// forwardRef 的结构
const ForwardedComponent = forwardRef((props, ref) => {
  // 这是一个新的渲染函数
  // ref 作为第二个参数传入
  useImperativeHandle(ref, () => ({
    // 这里的方法在渲染时定义，但不一定在响应式上下文中执行
  }))
  
  return <div>...</div>
})
```

### 3. 问题的根源

当使用 `forwardRef` 时，有两个关键问题：

#### 问题 1: 包裹顺序

```tsx
// ❌ 错误顺序
const Component = forwardRef(observer(MyComponent))
// forwardRef 接收到的不是原始函数，而是被 observer 包装后的组件
// React 会报错：forwardRef requires a render function

// ✅ 正确顺序
const Component = observer(forwardRef(MyComponent))
// observer 包装 forwardRef 组件，可以正确追踪
```

#### 问题 2: useImperativeHandle 的上下文

即使顺序正确，`useImperativeHandle` 中暴露的方法也可能不在响应式上下文中：

```tsx
const Component = observer(
  forwardRef((props, ref) => {
    const store = useStore()
    
    useImperativeHandle(ref, () => ({
      // ⚠️ 这个方法对象在组件渲染时创建
      // 但方法本身可能在未来某个时刻被调用（不在渲染阶段）
      getState: () => store.todos, // 此时可能不在响应式追踪上下文中
    }))
    
    // ✅ 这里的访问会被追踪
    return <div>{store.todos.length}</div>
  })
)
```

**核心问题**：
- 组件渲染时，`observer` 会追踪对 `store.todos.length` 的访问 ✅
- 但是通过 `ref.current.getState()` 调用时，访问 `store.todos` 的时机**不在渲染阶段**
- MobX 的响应式追踪只在**渲染阶段**或**被 reaction.track 包裹的代码**中生效

---

## ✅ 解决方案

### 方案 1: 在 useImperativeHandle 中手动追踪（推荐）

```tsx
import { observer } from 'mobx-react-lite'
import { runInAction } from 'mobx'
import { forwardRef, useImperativeHandle } from 'react'

const MyComponent = observer(
  forwardRef<MyRef, Props>((props, ref) => {
    const store = useStore()
    
    useImperativeHandle(ref, () => ({
      // ✅ 方案 1a: 返回最新的数据快照
      getState: () => {
        // 在方法执行时访问，但注意：这只是读取，不会触发组件更新
        return {
          todos: store.todos.map(t => ({ ...t })), // 创建副本
          count: store.todos.length
        }
      },
      
      // ✅ 方案 1b: 对于修改操作，使用 runInAction
      updateState: () => {
        runInAction(() => {
          store.addTodo('new todo')
        })
        // 这会触发响应式更新，因为 store 是 observable
      }
    }))
    
    return <div>{store.todos.length}</div>
  })
)
```

### 方案 2: 使用 useLocalObservable + useMemo

```tsx
import { observer } from 'mobx-react-lite'
import { useLocalObservable } from 'mobx-react-lite'
import { forwardRef, useImperativeHandle, useMemo } from 'react'

const MyComponent = observer(
  forwardRef<MyRef, Props>((props, ref) => {
    const store = useStore()
    
    // 创建一个本地的 observable 代理
    const localState = useLocalObservable(() => ({
      // 计算属性会自动追踪依赖
      get todosCount() {
        return store.todos.length
      },
      get todos() {
        return store.todos
      }
    }))
    
    // 使用 useMemo 确保方法在依赖变化时更新
    const imperativeHandle = useMemo(() => ({
      getState: () => {
        // 访问 localState，这会触发依赖追踪
        return {
          todos: localState.todos,
          count: localState.todosCount
        }
      },
      updateState: () => {
        store.addTodo('new todo')
      }
    }), [store, localState.todos, localState.todosCount])
    
    useImperativeHandle(ref, () => imperativeHandle, [imperativeHandle])
    
    return <div>{localState.todosCount}</div>
  })
)
```

### 方案 3: 在方法中直接访问 store（最简单）

```tsx
const MyComponent = observer(
  forwardRef<MyRef, Props>((props, ref) => {
    const store = useStore()
    
    useImperativeHandle(ref, () => ({
      // ✅ 最简单：直接返回 store 引用
      // 调用方可以通过 store 访问最新状态
      getStore: () => store,
      
      // ✅ 或者提供便捷方法
      getTodos: () => store.todos, // 返回引用，调用方会得到最新值
      addTodo: (title: string) => store.addTodo(title)
    }))
    
    return <div>{store.todos.length}</div>
  })
)

// 使用方
const Parent = () => {
  const childRef = useRef<MyRef>(null)
  
  const handleClick = () => {
    // ✅ 在调用时访问，会得到最新状态
    const todos = childRef.current?.getTodos()
    console.log(todos) // 最新的 todos
  }
  
  return (
    <>
      <MyComponent ref={childRef} />
      <button onClick={handleClick}>Get State</button>
    </>
  )
}
```

### 方案 4: 使用 ref 传递响应式对象（高级）

```tsx
import { observer } from 'mobx-react-lite'
import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { autorun } from 'mobx'

interface MyRef {
  // 返回 observable 对象，调用方可以用 observer 监听
  getObservableState: () => { todos: Todo[] }
  // 或者直接暴露 store
  getStore: () => typeof store
}

const MyComponent = observer(
  forwardRef<MyRef, Props>((props, ref) => {
    const store = useStore()
    
    useImperativeHandle(ref, () => ({
      // ✅ 返回 observable 对象本身，而不是快照
      getObservableState: () => ({ todos: store.todos }),
      getStore: () => store
    }))
    
    return <div>{store.todos.length}</div>
  })
)

// 使用方：如果需要响应式，可以使用 observer 或 autorun
const Parent = observer(() => {
  const childRef = useRef<MyRef>(null)
  
  useEffect(() => {
    const state = childRef.current?.getObservableState()
    if (state) {
      // ✅ 使用 autorun 监听 observable
      const disposer = autorun(() => {
        console.log('Todos changed:', state.todos.length)
      })
      return disposer
    }
  }, [])
  
  return <MyComponent ref={childRef} />
})
```

---

## 🎯 最佳实践总结

### ✅ 推荐做法

1. **正确的包裹顺序**：
   ```tsx
   observer(forwardRef(Component))
   ```

2. **直接暴露 store 引用**：
   ```tsx
   useImperativeHandle(ref, () => ({
     getStore: () => store, // 返回 observable 对象本身
   }))
   ```

3. **对于修改操作，确保在 action 中**：
   ```tsx
   updateTodo: (id: string) => {
     store.updateTodo(id) // store 的方法应该是 action
   }
   ```

### ❌ 避免的做法

1. **错误的包裹顺序**：
   ```tsx
   forwardRef(observer(Component)) // ❌
   ```

2. **在 useImperativeHandle 中创建快照并期望响应式**：
   ```tsx
   useImperativeHandle(ref, () => ({
     // ❌ 创建快照后，后续状态变化不会反映在这个快照上
     getState: () => ({ todos: [...store.todos] })
   }))
   ```

3. **在方法中访问状态但不返回 observable**：
   ```tsx
   useImperativeHandle(ref, () => ({
     // ❌ 只在创建时读取一次，后续不会更新
     getCount: () => store.todos.length
   }))
   ```

---

## 🔬 技术细节

### MobX 响应式追踪的工作原理

```tsx
// MobX 的追踪只在特定上下文中工作：

// ✅ 上下文 1: 组件渲染（被 observer 包裹）
observer(() => {
  return <div>{store.todos.length}</div> // 会被追踪
})

// ✅ 上下文 2: reaction.track()
reaction.track(() => {
  return store.todos.length // 会被追踪
})

// ✅ 上下文 3: computed 函数
computed(() => store.todos.length) // 会被追踪

// ❌ 不在上下文中：普通函数调用
const getCount = () => store.todos.length
getCount() // 不会被追踪，但会读取最新值
```

### forwardRef 的渲染流程

```tsx
// React 的渲染流程：
1. forwardRef 组件接收 (props, ref)
2. 组件函数体执行
3. useImperativeHandle 在渲染时定义方法对象
4. 方法对象被赋值给 ref.current
5. 组件返回 JSX

// 问题：
- useImperativeHandle 中定义的方法在未来某个时刻被调用
- 此时不在组件渲染阶段
- 因此不在 observer 的追踪上下文中
```

---

## 📝 完整示例

```tsx
import { observer } from 'mobx-react-lite'
import { forwardRef, useImperativeHandle } from 'react'

interface TodoListRef {
  // 返回 observable 对象，调用方总是得到最新状态
  getStore: () => typeof store
  // 或者提供便捷方法（每次调用都返回最新值）
  getTodos: () => Todo[]
  addTodo: (title: string) => void
  // 如果需要同步状态快照
  getSnapshot: () => { todos: Todo[], count: number }
}

interface Props {
  // ... 其他 props
}

const TodoList = observer(
  forwardRef<TodoListRef, Props>((props, ref) => {
    const store = useStore()
    
    useImperativeHandle(ref, () => ({
      // ✅ 最佳实践：返回 store 本身
      getStore: () => store,
      
      // ✅ 或者提供方法，每次调用都访问最新状态
      getTodos: () => store.todos, // 返回 observable 数组
      
      // ✅ 对于修改，直接调用 store 的 action
      addTodo: (title: string) => {
        store.addTodo(title)
      },
      
      // ✅ 如果需要不可变的快照
      getSnapshot: () => ({
        todos: store.todos.map(t => ({ ...t })),
        count: store.todos.length
      })
    }))
    
    // ✅ 组件内部的访问会被 observer 追踪
    return (
      <div>
        <p>Count: {store.todos.length}</p>
        {store.todos.map(todo => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    )
  })
)

// 使用示例
const App = observer(() => {
  const listRef = useRef<TodoListRef>(null)
  
  const handleGetState = () => {
    // ✅ 每次调用都获取最新状态
    const todos = listRef.current?.getTodos()
    console.log('Current todos:', todos)
    
    // ✅ 或者获取 store 并直接访问
    const store = listRef.current?.getStore()
    if (store) {
      console.log('Todo count:', store.todos.length)
    }
  }
  
  return (
    <div>
      <TodoList ref={listRef} />
      <button onClick={handleGetState}>Get State</button>
    </div>
  )
})
```

---

## 总结

**核心原因**：
- `observer` 只在组件渲染阶段追踪 observable 访问
- `useImperativeHandle` 暴露的方法在渲染时定义，但在未来某个时刻调用
- 方法调用时不在响应式追踪上下文中，因此无法建立依赖追踪

**解决方案**：
- 返回 observable 对象本身（推荐）
- 或者每次都重新访问 store（方法调用时访问最新值）
- 避免在渲染时创建状态快照并期望它保持响应式

