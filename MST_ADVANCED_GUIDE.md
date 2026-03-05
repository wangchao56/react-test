# MST (MobX State Tree) 高级用法指南

## 目录

1. [Patches (补丁系统)](#1-patches-补丁系统)
2. [Snapshots (快照)](#2-snapshots-快照)
3. [References (引用)](#3-references-引用)
4. [Volatiles (临时状态)](#4-volatiles-临时状态)
5. [Middleware (中间件)](#5-middleware-中间件)
6. [Lifecycle Hooks (生命周期钩子)](#6-lifecycle-hooks-生命周期钩子)
7. [Custom Types (自定义类型)](#7-custom-types-自定义类型)
8. [Environment (环境依赖注入)](#8-environment-环境依赖注入)
9. [Time Travel / Undo-Redo (撤销重做)](#9-time-travel--undo-redo-撤销重做)
10. [Model Composition (模型组合)](#10-model-composition-模型组合)
11. [Async Actions with Flow](#11-async-actions-with-flow-异步操作)
12. [Type Safety Patterns](#12-type-safety-patterns-类型安全模式)

---

## 1. Patches (补丁系统)

**用途**：追踪状态变化，实现增量更新、同步、审计等功能。

### 基础用法

```typescript
import { onPatch, applyPatch } from 'mobx-state-tree'

// 监听所有补丁
onPatch(store, (patch, reversePatch) => {
  console.log('补丁:', patch)
  console.log('反向补丁（用于撤销）:', reversePatch)
  // patch: { op: "add", path: "/todos/0", value: {...} }
  // reversePatch: { op: "remove", path: "/todos/0" }
})

// 应用补丁
applyPatch(store, {
  op: 'replace',
  path: '/todos/0/title',
  value: '新标题'
})
```

### 实际应用：操作历史记录

```typescript
// 保存所有操作历史
const history: any[] = []

onPatch(store, (patch, reversePatch) => {
  history.push({
    patch,
    reversePatch,
    timestamp: Date.now()
  })
})

// 撤销最后一个操作
function undo() {
  const last = history.pop()
  if (last) {
    applyPatch(store, last.reversePatch)
  }
}
```

---

## 2. Snapshots (快照)

**用途**：状态序列化、持久化、时间旅行、状态迁移。

### 基础用法

```typescript
import { getSnapshot, applySnapshot, getParent, onSnapshot } from 'mobx-state-tree'

// 获取当前状态快照（JSON）
const snapshot = getSnapshot(store)
console.log(JSON.stringify(snapshot, null, 2))

// 应用快照（恢复状态）
applySnapshot(store, {
  todos: [],
  filter: 'all'
})

// 监听快照变化
onSnapshot(store, (snapshot) => {
  localStorage.setItem('store', JSON.stringify(snapshot))
})
```

### 实际应用：版本迁移

```typescript
function migrateSnapshot(snapshot: any, fromVersion: number, toVersion: number) {
  if (fromVersion === 1 && toVersion === 2) {
    // 迁移逻辑：为旧数据添加新字段
    snapshot.todos = snapshot.todos.map((todo: any) => ({
      ...todo,
      version: 2,
      createdAt: todo.createdAt || new Date().toISOString()
    }))
  }
  return snapshot
}
```

---

## 3. References (引用)

**用途**：模型间关系、避免重复数据、维护数据一致性。

### 基础用法

```typescript
import { types, getParent } from 'mobx-state-tree'

// 定义用户模型
const UserModel = types.model('User', {
  id: types.identifier,
  name: types.string,
})

// 定义 Todo 模型，引用用户
const TodoModel = types
  .model('Todo', {
    id: types.identifier,
    title: types.string,
    assigneeId: types.maybeNull(types.reference(UserModel)), // 引用
  })
  .views((self) => ({
    // 访问引用的用户
    get assignee() {
      return self.assigneeId // 自动解析引用
    },
  }))

// 定义 Store
const Store = types.model('Store', {
  users: types.array(UserModel),
  todos: types.array(TodoModel),
})

const store = Store.create({
  users: [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ],
  todos: [
    { id: '1', title: '任务1', assigneeId: '1' }, // 引用用户 ID
  ],
})

// 访问引用
console.log(store.todos[0].assignee.name) // 'Alice'
```

### 实际应用：分类引用

```typescript
// 分类模型
const CategoryModel = types.model('Category', {
  id: types.identifier,
  name: types.string,
  color: types.string,
})

// Todo 引用分类
const TodoModel = types.model('Todo', {
  id: types.identifier,
  title: types.string,
  categoryId: types.maybeNull(
    types.reference(CategoryModel, {
      // 自定义解析逻辑（如果需要）
      onInvalidated(ev) {
        console.log('引用失效:', ev)
      },
    })
  ),
})

const Store = types.model('Store', {
  categories: types.array(CategoryModel),
  todos: types.array(TodoModel),
})
```

---

## 4. Volatiles (临时状态)

**用途**：不持久化的临时状态（UI 状态、加载状态、缓存等）。

### 基础用法

```typescript
const TodoModel = types
  .model('Todo', {
    id: types.identifier,
    title: types.string,
  })
  .volatile((self) => ({
    // 临时状态，不会被序列化
    isLoading: false,
    error: null as string | null,
    editMode: false,
  }))
  .actions((self) => ({
    setLoading(loading: boolean) {
      self.isLoading = loading
    },
    setError(error: string | null) {
      self.error = error
    },
  }))

// volatile 状态不会出现在快照中
const snapshot = getSnapshot(todo)
// snapshot 中没有 isLoading, error, editMode
```

### 实际应用：UI 状态管理

```typescript
const TodoStore = types
  .model('TodoStore', {
    todos: types.array(TodoModel),
  })
  .volatile((self) => ({
    // UI 相关状态
    selectedTodoIds: [] as string[],
    draggedTodoId: null as string | null,
    filterPanelOpen: false,
    // 缓存
    searchResultsCache: new Map<string, any>(),
  }))
  .actions((self) => ({
    toggleSelection(todoId: string) {
      const index = self.selectedTodoIds.indexOf(todoId)
      if (index > -1) {
        self.selectedTodoIds.splice(index, 1)
      } else {
        self.selectedTodoIds.push(todoId)
      }
    },
  }))
```

---

## 5. Middleware (中间件)

**用途**：拦截 actions、日志记录、权限检查、性能监控。

### 基础用法

```typescript
import { addMiddleware } from 'mobx-state-tree'

// 日志中间件
addMiddleware(store, (call, next, abort) => {
  console.log(`[${call.name}]`, call.args)
  const result = next(call)
  console.log(`[${call.name}] 完成`, result)
  return result
})

// 权限检查中间件
addMiddleware(store, (call, next, abort) => {
  if (call.name === 'deleteTodo' && !isAdmin()) {
    console.warn('无权限删除')
    abort() // 阻止执行
    return
  }
  return next(call)
})
```

### 实际应用：操作审计

```typescript
const auditMiddleware = (call: any, next: any) => {
  const auditLog = {
    action: call.name,
    args: call.args,
    timestamp: new Date(),
    userId: getCurrentUserId(),
  }
  
  // 发送到服务器
  sendAuditLog(auditLog)
  
  return next(call)
}

addMiddleware(store, auditMiddleware)
```

---

## 6. Lifecycle Hooks (生命周期钩子)

**用途**：在模型创建、销毁、修改时执行逻辑。

### 基础用法

```typescript
import { addDisposer, getEnv, onSnapshot } from 'mobx-state-tree'

const TodoModel = types
  .model('Todo', {
    id: types.identifier,
    title: types.string,
  })
  .actions((self) => ({
    afterCreate() {
      // 创建后执行
      console.log('Todo 已创建:', self.id)
      // 例如：发送分析事件
      trackEvent('todo_created', { id: self.id })
    },
    
    beforeDestroy() {
      // 销毁前执行（使用 detach 时）
      console.log('Todo 将被销毁:', self.id)
    },
    
    afterAttach() {
      // 附加到父模型后执行
      console.log('Todo 已附加')
    },
    
    beforeDetach() {
      // 从父模型分离前执行
      console.log('Todo 将被分离')
    },
  }))
```

### 实际应用：自动保存

```typescript
const TodoModel = types
  .model('Todo', {
    id: types.identifier,
    title: types.string,
  })
  .actions((self) => ({
    afterCreate() {
      // 监听变化，自动保存
      const disposer = onSnapshot(self, (snapshot) => {
        saveTodoToServer(self.id, snapshot)
      })
      
      // 清理函数
      addDisposer(self, disposer)
    },
  }))
```

---

## 7. Custom Types (自定义类型)

**用途**：扩展 MST 类型系统，处理特殊数据类型。

### 基础用法

```typescript
import { types, IAnyType } from 'mobx-state-tree'

// 自定义日期类型
const DateType = types.custom<string, Date>({
  name: 'Date',
  fromSnapshot(value: string): Date {
    return new Date(value)
  },
  toSnapshot(value: Date): string {
    return value.toISOString()
  },
  isTargetType(value: any): boolean {
    return value instanceof Date
  },
  getValidationMessage(value: any): string {
    if (isNaN(value.getTime())) {
      return '无效的日期'
    }
    return ''
  },
})

// 使用自定义类型
const TodoModel = types.model('Todo', {
  dueDate: DateType,
})
```

### 实际应用：URL 类型、Email 类型

```typescript
// URL 类型
const URLType = types.custom<string, URL>({
  name: 'URL',
  fromSnapshot(value: string): URL {
    return new URL(value)
  },
  toSnapshot(value: URL): string {
    return value.toString()
  },
  isTargetType(value: any): boolean {
    return value instanceof URL
  },
  getValidationMessage(value: any): string {
    try {
      new URL(value)
      return ''
    } catch {
      return '无效的 URL'
    }
  },
})

// Email 类型
const EmailType = types.refinement(
  types.string,
  (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  '必须是有效的邮箱地址'
)
```

---

## 8. Environment (环境依赖注入)

**用途**：注入外部依赖（API、配置、服务）。

### 基础用法

```typescript
const TodoStore = types
  .model('TodoStore', {
    todos: types.array(TodoModel),
  })
  .actions((self) => ({
    async fetchTodos() {
      // 从 environment 获取 API 服务
      const api = getEnv(self).api
      const todos = await api.getTodos()
      self.todos.replace(todos)
    },
  }))

// 创建时注入 environment
const store = TodoStore.create(
  { todos: [] },
  {
    api: {
      getTodos: async () => fetch('/api/todos').then(r => r.json()),
      saveTodo: async (todo) => fetch('/api/todos', { method: 'POST', body: JSON.stringify(todo) }),
    },
    config: {
      apiUrl: 'https://api.example.com',
    },
  }
)
```

### 实际应用：测试时替换依赖

```typescript
// 生产环境
const store = TodoStore.create(
  { todos: [] },
  { api: realApiService }
)

// 测试环境
const mockApi = {
  getTodos: jest.fn(() => Promise.resolve([])),
  saveTodo: jest.fn(),
}
const testStore = TodoStore.create(
  { todos: [] },
  { api: mockApi }
)
```

---

## 9. Time Travel / Undo-Redo (撤销重做)

**用途**：实现状态历史、撤销重做功能。

### 完整实现

```typescript
import { onPatch, applyPatch, IAnyStateTreeNode } from 'mobx-state-tree'

class HistoryManager {
  private history: Array<{ patch: any; reversePatch: any }> = []
  private currentIndex = -1
  private store: IAnyStateTreeNode

  constructor(store: IAnyStateTreeNode) {
    this.store = store
    
    // 监听所有变化
    onPatch(store, (patch, reversePatch) => {
      // 如果有新的操作，清除后面的历史
      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1)
      }
      
      this.history.push({ patch, reversePatch })
      this.currentIndex = this.history.length - 1
    })
  }

  undo() {
    if (this.currentIndex >= 0) {
      const { reversePatch } = this.history[this.currentIndex]
      applyPatch(this.store, reversePatch)
      this.currentIndex--
    }
  }

  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      const { patch } = this.history[this.currentIndex]
      applyPatch(this.store, patch)
    }
  }

  canUndo() {
    return this.currentIndex >= 0
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1
  }
}

// 使用
const store = TodoStore.create({ todos: [] })
const history = new HistoryManager(store)

// 撤销
history.undo()

// 重做
history.redo()
```

---

## 10. Model Composition (模型组合)

**用途**：代码复用、模块化、组合复杂模型。

### 基础用法

```typescript
// 基础模型
const BaseEntity = types.model('BaseEntity', {
  id: types.identifier,
  createdAt: types.optional(types.Date, () => new Date()),
  updatedAt: types.optional(types.Date, () => new Date()),
})

// 可时间戳的模型
const Timestamped = types.compose(
  BaseEntity,
  types.model({
    updatedAt: types.optional(types.Date, () => new Date()),
  }).actions((self) => ({
    updateTimestamp() {
      self.updatedAt = new Date()
    },
  }))
)

// 可软删除的模型
const SoftDeletable = types.model({
  deletedAt: types.maybeNull(types.Date),
}).views((self) => ({
  get isDeleted() {
    return self.deletedAt !== null
  },
})).actions((self) => ({
  softDelete() {
    self.deletedAt = new Date()
  },
  restore() {
    self.deletedAt = null
  },
}))

// 组合多个特性
const TodoModel = types.compose(
  Timestamped,
  SoftDeletable,
  types.model({
    title: types.string,
    completed: types.boolean,
  })
)
```

---

## 11. Async Actions with Flow (异步操作)

**用途**：处理异步操作、错误处理、加载状态。

### 基础用法

```typescript
import { flow } from 'mobx-state-tree'

const TodoStore = types
  .model('TodoStore', {
    todos: types.array(TodoModel),
    isLoading: types.optional(types.boolean, false),
    error: types.maybeNull(types.string),
  })
  .actions((self) => ({
    // 使用 flow 处理异步
    fetchTodos: flow(function* () {
      self.isLoading = true
      self.error = null
      
      try {
        const response = yield fetch('/api/todos')
        const data = yield response.json()
        self.todos.replace(data)
      } catch (error: any) {
        self.error = error.message
      } finally {
        self.isLoading = false
      }
    }),

    // 带参数的异步操作
    saveTodo: flow(function* (todo: any) {
      self.isLoading = true
      try {
        const response = yield fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo),
        })
        const saved = yield response.json()
        const existing = self.todos.find(t => t.id === saved.id)
        if (existing) {
          applySnapshot(existing, saved)
        } else {
          self.todos.push(saved)
        }
      } catch (error: any) {
        self.error = error.message
        throw error
      } finally {
        self.isLoading = false
      }
    }),
  }))
```

---

## 12. Type Safety Patterns (类型安全模式)

**用途**：提高 TypeScript 类型安全。

### 模式 1: 使用 SnapshotIn 和 SnapshotOut

```typescript
import { SnapshotIn, SnapshotOut, Instance } from 'mobx-state-tree'

const TodoModel = types.model('Todo', {
  id: types.identifier,
  title: types.string,
})

// 类型定义
type TodoSnapshotIn = SnapshotIn<typeof TodoModel> // 创建时的类型
type TodoSnapshotOut = SnapshotOut<typeof TodoModel> // 快照类型
type TodoInstance = Instance<typeof TodoModel> // 实例类型

// 使用
function createTodo(data: TodoSnapshotIn): TodoInstance {
  return TodoModel.create(data)
}

function saveTodo(todo: TodoInstance): TodoSnapshotOut {
  return getSnapshot(todo)
}
```

### 模式 2: 类型守卫

```typescript
import { isStateTreeNode } from 'mobx-state-tree'

function isTodo(value: any): value is TodoInstance {
  return isStateTreeNode(value) && TodoModel.is(value)
}

function processTodo(todo: TodoInstance | any) {
  if (isTodo(todo)) {
    // TypeScript 知道 todo 是 TodoInstance
    console.log(todo.title)
  }
}
```

---

## 总结

这些高级特性让 MST 成为一个强大的状态管理解决方案：

- **Patches**: 细粒度变化追踪
- **Snapshots**: 状态持久化和迁移
- **References**: 模型关系管理
- **Volatiles**: UI 状态管理
- **Middleware**: 横切关注点
- **Lifecycle**: 自动化逻辑
- **Custom Types**: 类型扩展
- **Environment**: 依赖注入
- **Time Travel**: 历史管理
- **Composition**: 代码复用
- **Flow**: 异步处理
- **Type Safety**: TypeScript 支持

选择适合你项目需求的特性组合使用！

