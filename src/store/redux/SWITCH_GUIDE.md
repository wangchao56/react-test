# 切换到 Redux Toolkit 版本指南

## 快速切换

只需要修改 `src/main.tsx` 中的一个导入：

### 步骤 1: 修改 main.tsx

**之前（MST 版本）:**
```tsx
import { rootStore } from './store'
import { StoreProvider } from './store/StoreContext'
```

**改为（Redux Toolkit 版本）:**
```tsx
import { StoreProvider } from './store/redux/StoreContext'
```

**完整代码:**
```tsx
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './store/redux/StoreContext'

createRoot(document.getElementById('root')!).render(
  <StoreProvider>
    <App />
  </StoreProvider>
)
```

### 步骤 2: 组件代码保持不变！

所有组件代码都**无需修改**，因为 API 完全兼容：

- ✅ `store.addTodo()` - 工作正常
- ✅ `store.todos` - 返回 TodoProxy 数组
- ✅ `store.filteredTodos` - 返回过滤后的 todos
- ✅ `todo.toggle()` - 工作正常
- ✅ `todo.updateTitle()` - 工作正常
- ✅ 所有其他方法和属性都兼容

## 验证

运行应用后，检查：

1. ✅ 添加任务是否正常工作
2. ✅ 编辑任务是否正常工作
3. ✅ 筛选和排序是否正常工作
4. ✅ 统计数据是否正确显示
5. ✅ localStorage 持久化是否正常

## 回退到 MST

如果遇到问题，只需要改回原来的导入：

```tsx
import { rootStore } from './store'
import { StoreProvider } from './store/StoreContext'

createRoot(document.getElementById('root')!).render(
  <StoreProvider store={rootStore}>
    <App />
  </StoreProvider>
)
```

## 注意事项

1. **响应式更新**: Redux Toolkit 版本使用 `useSelector` 自动处理响应式更新，组件会在状态变化时自动重新渲染。

2. **Todo 对象**: Todo 对象现在是 `TodoProxy` 实例，提供了与 MST 相同的 API（如 `todo.toggle()`, `todo.updateTitle()` 等）。

3. **性能**: Redux Toolkit 使用 `createSelector` 进行 memoization，性能与 MST 相当。

4. **DevTools**: 可以安装 Redux DevTools 浏览器扩展来调试状态。

## 文件结构

```
src/store/
├── redux/                    # Redux Toolkit 版本
│   ├── models/
│   │   └── Todo.ts          # Todo 类型定义
│   ├── stores/
│   │   └── todoSlice.ts     # Redux slice
│   ├── TodoAdapter.ts       # API 适配器
│   ├── StoreContext.tsx     # React Context
│   ├── index.ts            # Store 配置
│   └── README.md           # 详细文档
└── [MST 版本文件保持不变]
```

## 特性对比

| 特性 | MST 版本 | Redux Toolkit 版本 |
|------|----------|-------------------|
| **API 兼容性** | ✅ | ✅ 完全兼容 |
| **组件修改** | - | ❌ 无需修改 |
| **响应式更新** | MobX observer | Redux useSelector |
| **性能** | ✅ 优秀 | ✅ 优秀（memoization） |
| **DevTools** | ✅ 有 | ✅ 更成熟 |
| **包大小** | ~50KB | ~20KB |

## 问题排查

如果遇到问题：

1. **检查控制台错误** - 查看是否有类型错误或运行时错误
2. **检查 Redux DevTools** - 查看状态是否正确更新
3. **检查 localStorage** - 确认数据格式是否兼容
4. **对比 MST 版本** - 看看 MST 版本是否正常工作

## 成功切换的标志

- ✅ 应用正常运行
- ✅ 所有功能正常工作
- ✅ 控制台没有错误
- ✅ Redux DevTools 显示状态更新

