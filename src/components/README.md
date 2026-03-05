# 组件使用说明

## 双版本导出

每个组件都提供了两个版本，以适应不同的状态管理库：

### 1. **MST 版本**（带 `observer`，用于 MobX State Tree）
- `TodoListMST`
- `TodoItemMST`
- `TodoFiltersMST`

### 2. **Redux 版本**（不带 `observer`，用于 Redux Toolkit）
- `TodoList`
- `TodoItem`
- `TodoFilters`

## 使用方法

### 使用 MST 版本

**App.tsx:**
```tsx
import { TodoListMST } from './components'
import { StoreProvider, rootStore } from './store'

function App() {
  return (
    <StoreProvider store={rootStore}>
      <TodoListMST />
    </StoreProvider>
  )
}
```

### 使用 Redux 版本

**App.tsx:**
```tsx
import { TodoList } from './components'
import { StoreProvider } from './store/redux/StoreContext'

function App() {
  return (
    <StoreProvider>
      <TodoList />
    </StoreProvider>
  )
}
```

## 组件导出

所有组件都可以从 `./components/index.ts` 统一导入：

```tsx
// MST 版本
import { TodoListMST, TodoItemMST, TodoFiltersMST } from './components'

// Redux 版本
import { TodoList, TodoItem, TodoFilters } from './components'

// 或者一起导入
import {
  TodoList,        // Redux 版本
  TodoListMST,     // MST 版本
  TodoItem,
  TodoItemMST,
  TodoFilters,
  TodoFiltersMST,
  TodoForm,        // 不依赖状态管理
} from './components'
```

## 切换状态管理库

只需要修改：

1. **Provider** - 使用对应的 StoreProvider
2. **组件导入** - 使用对应版本的组件

例如，从 MST 切换到 Redux：

```tsx
// 之前（MST）
import { TodoListMST } from './components'
import { StoreProvider, rootStore } from './store'

// 之后（Redux）
import { TodoList } from './components'
import { StoreProvider } from './store/redux/StoreContext'
```

## 注意事项

1. **MST 版本**使用 `observer` HOC，自动响应 MobX 状态变化
2. **Redux 版本**不需要 `observer`，Redux 的 `useSelector` 会自动处理响应式更新
3. **API 完全兼容** - 两种版本的组件使用相同的 props 和 API
4. **子组件匹配** - MST 版本会自动使用 MST 版本的子组件，Redux 版本使用 Redux 版本的子组件

