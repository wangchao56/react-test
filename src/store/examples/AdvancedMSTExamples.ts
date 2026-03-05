/**
 * MST 高级用法示例集合
 * 这些示例可以直接在项目中参考和使用
 */

import {
  types,
  Instance,
  flow,
  getSnapshot,
  applySnapshot,
  onSnapshot,
  onPatch,
  applyPatch,
  getParent,
  getEnv,
  addDisposer,
  addMiddleware,
  SnapshotIn,
  SnapshotOut,
  isStateTreeNode,
} from 'mobx-state-tree'

// ============================================
// 1. References (引用) 示例
// ============================================

// 用户模型
export const UserModel = types.model('User', {
  id: types.identifier,
  name: types.string,
  email: types.string,
})

// 分类模型
export const CategoryModel = types.model('Category', {
  id: types.identifier,
  name: types.string,
  color: types.string,
})

// Todo 模型（使用引用）
export const TodoWithRefModel = types
  .model('TodoWithRef', {
    id: types.identifier,
    title: types.string,
    assigneeId: types.maybeNull(types.reference(UserModel)),
    categoryId: types.maybeNull(types.reference(CategoryModel)),
  })
  .views((self) => ({
    get assignee() {
      return self.assigneeId // 自动解析引用
    },
    get category() {
      return self.categoryId
    },
  }))

// 带引用的 Store
export const StoreWithRefs = types.model('StoreWithRefs', {
  users: types.array(UserModel),
  categories: types.array(CategoryModel),
  todos: types.array(TodoWithRefModel),
})

export type StoreWithRefsType = Instance<typeof StoreWithRefs>

// ============================================
// 2. Volatiles (临时状态) 示例
// ============================================

export const TodoWithVolatiles = types
  .model('TodoWithVolatiles', {
    id: types.identifier,
    title: types.string,
    completed: types.optional(types.boolean, false),
  })
  .volatile((self) => ({
    // 这些状态不会被序列化
    isLoading: false,
    error: null as string | null,
    editMode: false,
    selected: false,
  }))
  .actions((self) => ({
    setLoading(loading: boolean) {
      self.isLoading = loading
    },
    setError(error: string | null) {
      self.error = error
    },
    toggleEditMode() {
      self.editMode = !self.editMode
    },
    toggleSelection() {
      self.selected = !self.selected
    },
  }))

// ============================================
// 3. Custom Types (自定义类型) 示例
// ============================================

// 日期类型（字符串 <-> Date）
export const DateType = types.custom<string, Date>({
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
    if (isNaN(new Date(value).getTime())) {
      return '无效的日期'
    }
    return ''
  },
})

// Email 验证类型
export const EmailType = types.refinement(
  types.string,
  (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  '必须是有效的邮箱地址'
)

// URL 类型
export const URLType = types.custom<string, URL>({
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

// ============================================
// 4. Environment (环境依赖注入) 示例
// ============================================

interface TodoEnvironment {
  api: {
    fetchTodos: () => Promise<any[]>
    saveTodo: (todo: any) => Promise<any>
    deleteTodo: (id: string) => Promise<void>
  }
  config: {
    apiUrl: string
    enableCache: boolean
  }
}

export const TodoStoreWithEnv = types
  .model('TodoStoreWithEnv', {
    todos: types.array(
      types.model({
        id: types.identifier,
        title: types.string,
      })
    ),
    isLoading: types.optional(types.boolean, false),
    error: types.maybeNull(types.string),
  })
  .actions((self) => ({
    fetchTodos: flow(function* () {
      self.isLoading = true
      self.error = null
      
      try {
        const env = getEnv(self) as TodoEnvironment
        const todos = yield env.api.fetchTodos()
        self.todos.replace(todos)
      } catch (error: any) {
        self.error = error.message
      } finally {
        self.isLoading = false
      }
    }),

    saveTodo: flow(function* (todoData: any) {
      self.isLoading = true
      try {
        const env = getEnv(self) as TodoEnvironment
        const saved = yield env.api.saveTodo(todoData)
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

// 创建时注入环境
export function createTodoStoreWithEnv(env: TodoEnvironment) {
  return TodoStoreWithEnv.create(
    {
      todos: [],
      isLoading: false,
      error: null,
    },
    env
  )
}

// ============================================
// 5. Lifecycle Hooks (生命周期) 示例
// ============================================

export const TodoWithLifecycle = types
  .model('TodoWithLifecycle', {
    id: types.identifier,
    title: types.string,
  })
  .actions((self) => ({
    afterCreate() {
      console.log('Todo 已创建:', self.id)
      // 自动保存到服务器
      const disposer = onSnapshot(self, async (snapshot) => {
        try {
          // await saveToServer(self.id, snapshot)
          console.log('自动保存:', snapshot)
        } catch (error) {
          console.error('保存失败:', error)
        }
      })
      addDisposer(self, disposer)
    },

    beforeDestroy() {
      console.log('Todo 将被销毁:', self.id)
      // 清理资源
    },

    afterAttach() {
      console.log('Todo 已附加到父模型')
    },

    beforeDetach() {
      console.log('Todo 将从父模型分离')
    },
  }))

// ============================================
// 6. Model Composition (模型组合) 示例
// ============================================

// 基础实体
const BaseEntity = types.model('BaseEntity', {
  id: types.identifier,
  createdAt: types.optional(types.Date, () => new Date()),
})

// 可时间戳的
const Timestamped = types.compose(
  BaseEntity,
  types
    .model({
      updatedAt: types.optional(types.Date, () => new Date()),
    })
    .actions((self) => ({
      updateTimestamp() {
        self.updatedAt = new Date()
      },
    }))
)

// 可软删除的
const SoftDeletable = types
  .model({
    deletedAt: types.maybeNull(types.Date),
  })
  .views((self) => ({
    get isDeleted() {
      return self.deletedAt !== null
    },
  }))
  .actions((self) => ({
    softDelete() {
      self.deletedAt = new Date()
    },
    restore() {
      self.deletedAt = null
    },
  }))

// 可审计的
const Auditable = types
  .model({
    createdBy: types.maybeNull(types.string),
    updatedBy: types.maybeNull(types.string),
  })
  .actions((self) => ({
    setCreatedBy(userId: string) {
      self.createdBy = userId
    },
    setUpdatedBy(userId: string) {
      self.updatedBy = userId
    },
  }))

// 组合所有特性
export const EnhancedTodo = types.compose(
  Timestamped,
  SoftDeletable,
  Auditable,
  types.model({
    title: types.string,
    completed: types.boolean,
  }).actions((self) => ({
    updateTitle(newTitle: string, userId?: string) {
      ;(self as any).updateTimestamp()
      if (userId) {
        ;(self as any).setUpdatedBy(userId)
      }
      self.title = newTitle
    },
  }))
)

// ============================================
// 7. Middleware (中间件) 示例
// ============================================

// 日志中间件
export function createLoggerMiddleware() {
  return (call: any, next: any, abort: any) => {
    const start = Date.now()
    console.log(`[Action] ${call.name}`, call.args)
    
    const result = next(call)
    
    const duration = Date.now() - start
    console.log(`[Action] ${call.name} 完成 (${duration}ms)`, result)
    
    return result
  }
}

// 权限检查中间件
export function createAuthMiddleware(allowedActions: string[]) {
  return (call: any, next: any, abort: any) => {
    if (!allowedActions.includes(call.name)) {
      console.warn(`[Auth] 无权限执行: ${call.name}`)
      abort()
      return
    }
    return next(call)
  }
}

// 审计中间件
export function createAuditMiddleware() {
  return (call: any, next: any, abort: any) => {
    const auditLog = {
      action: call.name,
      args: call.args,
      timestamp: new Date().toISOString(),
      // userId: getCurrentUserId(),
    }
    
    console.log('[Audit]', auditLog)
    // 可以发送到服务器
    
    return next(call)
  }
}

// ============================================
// 8. Type Safety (类型安全) 示例
// ============================================

export type TodoSnapshotIn = SnapshotIn<typeof TodoWithRefModel>
export type TodoSnapshotOut = SnapshotOut<typeof TodoWithRefModel>
export type TodoInstance = Instance<typeof TodoWithRefModel>

// 类型守卫
export function isTodo(value: any): value is TodoInstance {
  return isStateTreeNode(value) && TodoWithRefModel.is(value)
}

// 类型安全的创建函数
export function createTodo(data: TodoSnapshotIn): TodoInstance {
  return TodoWithRefModel.create(data)
}

// ============================================
// 9. Patches (补丁系统) 使用示例
// ============================================

export function setupPatchTracking(store: any) {
  const patches: any[] = []

  onPatch(store, (patch, reversePatch) => {
    patches.push({
      patch,
      reversePatch,
      timestamp: Date.now(),
    })

    console.log('补丁:', patch)
    console.log('反向补丁:', reversePatch)
  })

  return {
    patches,
    undo: () => {
      const last = patches.pop()
      if (last) {
        applyPatch(store, last.reversePatch)
      }
    },
  }
}

// ============================================
// 10. Snapshots (快照) 使用示例
// ============================================

export function setupSnapshotPersistence(store: any, key: string) {
  // 加载
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      const snapshot = JSON.parse(stored)
      applySnapshot(store, snapshot)
    } catch (error) {
      console.error('加载快照失败:', error)
    }
  }

  // 保存
  const disposer = onSnapshot(store, (snapshot) => {
    localStorage.setItem(key, JSON.stringify(snapshot))
  })

  // 返回清理函数
  return disposer
}

// 版本迁移示例
export function migrateSnapshot(
  snapshot: any,
  fromVersion: number,
  toVersion: number
): any {
  let migrated = { ...snapshot }

  // 版本 1 -> 2: 添加 createdAt
  if (fromVersion === 1 && toVersion >= 2) {
    migrated.todos = (migrated.todos || []).map((todo: any) => ({
      ...todo,
      createdAt: todo.createdAt || new Date().toISOString(),
      version: 2,
    }))
  }

  // 版本 2 -> 3: 添加 category
  if (fromVersion <= 2 && toVersion >= 3) {
    migrated.todos = (migrated.todos || []).map((todo: any) => ({
      ...todo,
      category: todo.category || '',
      version: 3,
    }))
  }

  return migrated
}

// ============================================
// 11. Time Travel (时间旅行) 示例
// ============================================

export class HistoryManager {
  private history: Array<{ patch: any; reversePatch: any }> = []
  private currentIndex = -1
  private store: any

  constructor(store: any) {
    this.store = store

    onPatch(store, (patch, reversePatch) => {
      // 如果有新操作，清除后面的历史
      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1)
      }

      this.history.push({ patch, reversePatch })
      this.currentIndex = this.history.length - 1
    })
  }

  undo() {
    if (this.canUndo()) {
      const { reversePatch } = this.history[this.currentIndex]
      applyPatch(this.store, reversePatch)
      this.currentIndex--
      return true
    }
    return false
  }

  redo() {
    if (this.canRedo()) {
      this.currentIndex++
      const { patch } = this.history[this.currentIndex]
      applyPatch(this.store, patch)
      return true
    }
    return false
  }

  canUndo(): boolean {
    return this.currentIndex >= 0
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  clear() {
    this.history = []
    this.currentIndex = -1
  }

  getHistoryLength(): number {
    return this.history.length
  }
}

