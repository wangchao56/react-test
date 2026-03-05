# MST 高级用法快速参考

## 🚀 最常用的高级特性

### 1. **References (引用)** - 模型间关系
```typescript
// 在 Todo 中引用 User
assigneeId: types.maybeNull(types.reference(UserModel))
// 使用时直接访问，自动解析
todo.assignee.name // 自动获取用户
```

### 2. **Volatiles (临时状态)** - UI 状态
```typescript
.volatile((self) => ({
  isLoading: false,
  editMode: false,
}))
// 这些状态不会被序列化
```

### 3. **Patches (补丁)** - 变化追踪
```typescript
onPatch(store, (patch, reversePatch) => {
  // 追踪所有变化
  // reversePatch 可以用于撤销
})
```

### 4. **Snapshots (快照)** - 持久化
```typescript
const snapshot = getSnapshot(store) // 序列化
applySnapshot(store, snapshot) // 恢复
onSnapshot(store, (snapshot) => {
  // 自动保存
})
```

### 5. **Flow (异步)** - 异步操作
```typescript
fetchTodos: flow(function* () {
  self.isLoading = true
  const data = yield fetch('/api/todos')
  self.todos.replace(data)
  self.isLoading = false
})
```

### 6. **Middleware (中间件)** - 拦截 Actions
```typescript
addMiddleware(store, (call, next, abort) => {
  console.log('Action:', call.name)
  return next(call)
})
```

### 7. **Environment (环境)** - 依赖注入
```typescript
const store = Store.create(
  initialState,
  { api: apiService, config: config } // 注入依赖
)
```

### 8. **Lifecycle Hooks** - 生命周期
```typescript
.actions((self) => ({
  afterCreate() {
    // 创建后执行
  },
  beforeDestroy() {
    // 销毁前执行
  },
}))
```

### 9. **Custom Types** - 自定义类型
```typescript
const DateType = types.custom<string, Date>({
  fromSnapshot: (v) => new Date(v),
  toSnapshot: (v) => v.toISOString(),
})
```

### 10. **Model Composition** - 模型组合
```typescript
const EnhancedTodo = types.compose(
  Timestamped,
  SoftDeletable,
  Auditable,
  types.model({ title: types.string })
)
```

## 📁 文件结构

```
src/store/
├── models/
│   └── Todo.ts              # 基础模型
├── stores/
│   └── TodoStore.ts         # Store 定义
├── examples/                # 高级用法示例
│   ├── AdvancedMSTExamples.ts    # 所有高级特性实现
│   └── UsageExample.tsx          # React 组件使用示例
└── index.ts                 # Store 实例和导出

MST_ADVANCED_GUIDE.md        # 完整指南（详细说明）
MST_ADVANCED_QUICK_REFERENCE.md  # 快速参考（本文件）
```

## 🎯 使用场景对应表

| 需求 | 使用的特性 | 文件位置 |
|------|----------|---------|
| 模型间关系 | References | `AdvancedMSTExamples.ts` L30-70 |
| UI 状态（不持久化） | Volatiles | `AdvancedMSTExamples.ts` L75-95 |
| 变化追踪/审计 | Patches | `AdvancedMSTExamples.ts` L360-380 |
| 状态持久化 | Snapshots | `AdvancedMSTExamples.ts` L385-430 |
| 撤销重做 | History Manager | `AdvancedMSTExamples.ts` L435-480 |
| 异步操作 | Flow | `TodoStore.ts` 中已有示例 |
| 操作日志 | Middleware | `AdvancedMSTExamples.ts` L290-330 |
| 依赖注入（API） | Environment | `AdvancedMSTExamples.ts` L185-250 |
| 自动保存 | Lifecycle Hooks | `AdvancedMSTExamples.ts` L255-285 |
| 类型扩展 | Custom Types | `AdvancedMSTExamples.ts` L130-180 |
| 代码复用 | Model Composition | `AdvancedMSTExamples.ts` L335-355 |

## 🔧 快速集成到现有项目

### 添加撤销重做功能

```typescript
import { HistoryManager } from './store/examples/AdvancedMSTExamples'

const history = new HistoryManager(rootStore)

// 在组件中使用
<button onClick={() => history.undo()}>撤销</button>
<button onClick={() => history.redo()}>重做</button>
```

### 添加操作日志

```typescript
import { addMiddleware, createLoggerMiddleware } from './store/examples/AdvancedMSTExamples'

addMiddleware(rootStore, createLoggerMiddleware())
```

### 添加补丁追踪

```typescript
import { setupPatchTracking } from './store/examples/AdvancedMSTExamples'

const tracking = setupPatchTracking(rootStore)
tracking.undo() // 撤销最后一个操作
```

## 📚 更多信息

- **完整指南**: 查看 `MST_ADVANCED_GUIDE.md`
- **代码示例**: 查看 `src/store/examples/AdvancedMSTExamples.ts`
- **React 使用**: 查看 `src/store/examples/UsageExample.tsx`

## 💡 最佳实践

1. **优先使用 MST 内置特性**：computed、views、actions
2. **Volatiles 用于 UI 状态**：loading、error、editMode 等
3. **References 用于关系**：避免数据重复
4. **Patches 用于同步**：实时协作、审计
5. **Snapshots 用于持久化**：localStorage、版本迁移
6. **Environment 用于测试**：Mock 外部依赖
7. **Middleware 用于横切关注点**：日志、权限、性能

## 🎓 学习路径

1. ✅ 基础：Model、Actions、Views（已完成）
2. ✅ 进阶：References、Volatiles（本指南）
3. ✅ 高级：Patches、Snapshots、Middleware
4. ✅ 专家：Custom Types、Composition、Environment

现在你已经掌握了 MST 的所有高级特性！🎉

