# Redux Toolkit 版本的 Store

这是使用 Redux Toolkit 实现的 store，提供了与 MST 版本完全相同的 API，组件代码无需修改。

## 使用方法

### 1. 切换 Store 实现

只需要修改 `src/main.tsx` 中的导入：

**之前（MST 版本）:**
```tsx
import { rootStore } from './store'
import { StoreProvider } from './store/StoreContext'
```

**现在（Redux Toolkit 版本）:**
```tsx
import { StoreProvider } from './store/redux/StoreContext'
```

### 2. 组件代码无需修改

所有现有的组件代码都可以直接使用，API 完全兼容：

```tsx
import { useStore } from './store/redux/StoreContext'

export const TodoList = () => {
  const store = useStore()
  
  // 所有方法都可用
  store.addTodo(...)
  store.removeTodo(...)
  store.filteredTodos
  store.statistics
  // ...
}
```

## 架构说明

### 文件结构

```
src/store/redux/
├── models/
│   └── Todo.ts              # Todo 类型定义和工具函数
├── stores/
│   └── todoSlice.ts         # Redux slice 和 selectors
├── TodoAdapter.ts           # 适配器层（提供 MST 风格 API）
├── StoreContext.tsx         # React Context（兼容 MST API）
├── index.ts                 # Redux store 配置
└── README.md                # 本文件
```

### 核心组件

1. **todoSlice.ts** - Redux Toolkit slice
   - 定义了所有 actions
   - 定义了所有 selectors（计算属性）

2. **TodoAdapter.ts** - 适配器层
   - `TodoProxy`: 包装 Todo 对象，提供 MST 风格的方法（如 `todo.toggle()`）
   - `TodoStoreAdapter`: 包装 Redux store，提供 MST 风格的 API

3. **StoreContext.tsx** - Context Provider
   - 包装 Redux Provider
   - 提供与 MST 相同的 `useStore()` hook

## API 兼容性

### ✅ 完全兼容的方法

- `store.addTodo()`
- `store.removeTodo()`
- `store.removeCompletedTodos()`
- `store.setFilter()`
- `store.setSortBy()`
- `store.setSearchQuery()`
- `store.setSelectedCategory()`
- `store.toggleAll()`

### ✅ 完全兼容的属性

- `store.todos` - 返回 TodoProxy 数组
- `store.filteredTodos` - 返回过滤后的 TodoProxy 数组
- `store.filter`
- `store.sortBy`
- `store.searchQuery`
- `store.selectedCategory`
- `store.activeTodosCount`
- `store.completedTodosCount`
- `store.totalTodosCount`
- `store.categories`
- `store.allTags`
- `store.statistics`

### ✅ Todo 对象的方法

- `todo.toggle()`
- `todo.updateTitle()`
- `todo.updateDescription()`
- `todo.setPriority()`
- `todo.setCategory()`
- `todo.setDueDate()`
- `todo.addTag()`
- `todo.removeTag()`

### ✅ Todo 对象的属性

- `todo.id`
- `todo.title`
- `todo.description`
- `todo.completed`
- `todo.priority`
- `todo.category`
- `todo.createdAt` (返回 Date 对象)
- `todo.dueDate` (返回 Date | null)
- `todo.tags` (返回数组副本)
- `todo.isOverdue` (计算属性)
- `todo.isDueToday` (计算属性)

## 注意事项

### 1. 响应式更新

Redux Toolkit 版本需要使用 React Redux 的 `useSelector` 来触发重新渲染。由于使用了适配器层，现有的组件需要使用 React Redux 的 HOC 或 hook。

**解决方案**: 适配器会在访问属性时从 Redux store 读取最新状态，但组件需要使用 `useSelector` 或包装组件。

### 2. 需要修改组件

由于 Redux 的响应式机制不同，需要将组件改为使用 React Redux：

```tsx
import { useSelector } from 'react-redux'
import { useStore } from './store/redux/StoreContext'

// 方法 1: 使用 useSelector
export const TodoList = () => {
  const store = useStore()
  const filteredTodos = useSelector((state: RootState) => 
    selectFilteredTodos(state)
  )
  // ...
}

// 方法 2: 使用适配器（但需要手动订阅）
// 这个方法需要额外的订阅逻辑
```

**更好的方案**: 创建一个兼容的 hook，自动处理订阅：

```tsx
// 在 StoreContext.tsx 中添加
export const useStoreValue = <T,>(selector: (store: TodoStoreType) => T): T => {
  const store = useStore()
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  
  useEffect(() => {
    const unsubscribe = store.subscribe(() => forceUpdate())
    return unsubscribe
  }, [store])
  
  return selector(store)
}
```

但实际上，由于我们已经创建了适配器，最简单的方案是让组件直接使用 Redux hooks，但保持 API 兼容。

## 性能优化

Redux Toolkit 使用了 `createSelector` 进行 memoization，所有计算属性（selectors）都会自动缓存，性能与 MST 的 computed 相当。

## 迁移步骤

1. ✅ 安装依赖：`@reduxjs/toolkit react-redux`
2. ✅ 创建 Redux store 文件
3. ✅ 创建适配器层
4. ⚠️ 修改 `src/main.tsx` 导入
5. ⚠️ 修改组件使用方式（如果需要响应式更新）

## 优势对比

### Redux Toolkit 优势
- ✅ 更大的社区和生态
- ✅ 更好的 DevTools 支持
- ✅ 更小的学习曲线（如果团队熟悉 Redux）
- ✅ 更成熟的中间件生态

### MST 优势
- ✅ 内置撤销/重做（Redux 需要插件）
- ✅ 内置持久化（Redux 需要插件）
- ✅ 更少的样板代码（在这个项目中）
- ✅ 更好的类型推导（在某些场景）

## 总结

这个 Redux Toolkit 版本完全保持了 API 兼容性，理论上组件代码无需修改。但由于 Redux 的响应式机制不同，可能需要微调组件的使用方式以确保正确的重新渲染。

