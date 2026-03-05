/**
 * MST 高级用法在实际项目中的使用示例
 * 这个文件展示如何在 React 组件中使用这些高级特性
 */

import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { addMiddleware, onPatch } from 'mobx-state-tree'
import { rootStore } from '../index'
import {
  setupPatchTracking,
  setupSnapshotPersistence,
  HistoryManager,
  createLoggerMiddleware,
  createAuthMiddleware,
} from './AdvancedMSTExamples'

// ============================================
// 示例 1: 使用 Patch Tracking (补丁追踪)
// ============================================

export const PatchTrackingExample = observer(() => {
  const [patchHistory, setPatchHistory] = useState<any[]>([])
  const [tracking, setTracking] = useState<ReturnType<typeof setupPatchTracking> | null>(null)

  useEffect(() => {
    const trackingInstance = setupPatchTracking(rootStore)
    setTracking(trackingInstance)
    
    // 更新历史记录到 state
    const interval = setInterval(() => {
      setPatchHistory([...trackingInstance.patches])
    }, 100)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div>
      <h3>补丁追踪</h3>
      <button onClick={() => tracking?.undo()} disabled={!tracking}>
        撤销最后一个操作
      </button>
      <div>
        <strong>操作历史 ({patchHistory.length}):</strong>
        <ul>
          {patchHistory.slice(-5).map((item, idx) => (
            <li key={idx}>
              {item.patch.op} {item.patch.path}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
})

// ============================================
// 示例 2: 使用 History Manager (撤销重做)
// ============================================

let historyManager: HistoryManager | null = null

export const UndoRedoExample = observer(() => {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    if (!historyManager) {
      historyManager = new HistoryManager(rootStore)
    }

    // 定期检查是否可以撤销/重做
    const interval = setInterval(() => {
      if (historyManager) {
        setCanUndo(historyManager.canUndo())
        setCanRedo(historyManager.canRedo())
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <h3>撤销/重做</h3>
      <button
        onClick={() => historyManager?.undo()}
        disabled={!canUndo}
      >
        撤销 (Undo)
      </button>
      <button
        onClick={() => historyManager?.redo()}
        disabled={!canRedo}
      >
        重做 (Redo)
      </button>
      <div>
        历史记录数: {historyManager?.getHistoryLength() || 0}
      </div>
    </div>
  )
})

// ============================================
// 示例 3: 使用 Middleware (中间件)
// ============================================

export const MiddlewareExample = () => {
  useEffect(() => {
    // 添加日志中间件
    addMiddleware(rootStore, createLoggerMiddleware())

    // 添加权限检查中间件
    const allowedActions = ['addTodo', 'toggle', 'updateTitle']
    addMiddleware(rootStore, createAuthMiddleware(allowedActions))

    // 注意：在组件卸载时不需要清理中间件，它们会一直存在
  }, [])

  return (
    <div>
      <h3>中间件已启用</h3>
      <p>查看控制台查看操作日志和权限检查</p>
    </div>
  )
}

// ============================================
// 示例 4: 使用 Snapshot Persistence (快照持久化)
// ============================================

export const SnapshotPersistenceExample = () => {
  useEffect(() => {
    // 设置自动持久化（已有，这里只是展示如何使用）
    const disposer = setupSnapshotPersistence(rootStore, 'todoStore_v2')

    return () => {
      disposer() // 清理
    }
  }, [])

  const handleExport = () => {
    const snapshot = JSON.stringify(rootStore, null, 2)
    const blob = new Blob([snapshot], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `todos_backup_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const snapshot = JSON.parse(e.target?.result as string)
        // 应用快照
        // applySnapshot(rootStore, snapshot)
        console.log('导入成功:', snapshot)
        alert('导入成功（实际应用中需要 applySnapshot）')
      } catch (error) {
        console.error('导入失败:', error)
        alert('导入失败: 文件格式错误')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <h3>快照导入/导出</h3>
      <button onClick={handleExport}>导出备份</button>
      <div>
        <label>
          导入备份:
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
          />
        </label>
      </div>
    </div>
  )
}

// ============================================
// 示例 5: 实时同步 (使用 Patches)
// ============================================

export const RealtimeSyncExample = () => {
  useEffect(() => {
    // 模拟实时同步
    const disposer = onPatch(rootStore, (patch, reversePatch) => {
      // 发送到服务器
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patch, reversePatch }),
      }).catch(error => {
        console.error('同步失败:', error)
      })
    })

    return () => {
      disposer() // 清理
    }
  }, [])

  return (
    <div>
      <h3>实时同步</h3>
      <p>所有操作会自动同步到服务器</p>
    </div>
  )
}

// ============================================
// 组合使用所有功能的完整示例组件
// ============================================

export const AdvancedFeaturesDemo = observer(() => {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>MST 高级功能演示</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <UndoRedoExample />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <PatchTrackingExample />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <SnapshotPersistenceExample />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <MiddlewareExample />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <RealtimeSyncExample />
      </div>
    </div>
  )
})

