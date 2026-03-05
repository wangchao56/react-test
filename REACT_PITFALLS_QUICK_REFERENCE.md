# React 深坑快速参考表

## 🚨 最常见陷阱 TOP 10

| 陷阱 | 错误示例 | 正确做法 |
|------|---------|---------|
| **1. 状态更新异步** | `setCount(count + 1); setCount(count + 1)` | `setCount(prev => prev + 1); setCount(prev => prev + 1)` |
| **2. 闭包陷阱** | `useEffect(() => { setCount(count + 1) }, [])` | `useEffect(() => { setCount(prev => prev + 1) }, [])` |
| **3. 缺少依赖** | `useEffect(() => fetchData(id), [])` | `useEffect(() => fetchData(id), [id])` |
| **4. 对象依赖** | `useEffect(() => {...}, [user])` | `useEffect(() => {...}, [user.id])` |
| **5. 列表 key** | `<Item key={index} />` | `<Item key={item.id} />` |
| **6. 条件渲染** | `{count && <span>...</span>}` | `{count > 0 && <span>...</span>}` |
| **7. 内存泄漏** | `setInterval(...)` 未清理 | `return () => clearInterval(...)` |
| **8. 新对象/函数** | `value={{ a: 1 }}` 每次渲染 | `useMemo(() => ({ a: 1 }), [])` |
| **9. 事件参数** | `onClick={handleClick(id)}` | `onClick={() => handleClick(id)}` |
| **10. Context 值** | `value={{ theme, setTheme }}` | `useMemo(() => ({ theme, setTheme }), [theme])` |

## 🔍 检查清单

### 开发前检查

- [ ] 是否理解状态更新的异步性？
- [ ] useEffect 依赖数组是否正确？
- [ ] 是否有未清理的资源（定时器、订阅）？
- [ ] 列表的 key 是否唯一且稳定？
- [ ] 是否避免了在渲染中创建新对象/函数？

### 代码审查检查

- [ ] 所有 useEffect 都有清理函数吗？
- [ ] useMemo/useCallback 的依赖数组完整吗？
- [ ] 条件渲染是否正确处理了 falsy 值？
- [ ] Context value 是否稳定？
- [ ] 异步操作是否检查了组件挂载状态？

## 🛠️ 工具和技巧

### 1. ESLint 规则

```json
{
  "extends": [
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 2. React.StrictMode

```tsx
// 在开发环境启用，帮助发现潜在问题
<StrictMode>
  <App />
</StrictMode>
```

### 3. React DevTools

- Profiler：分析性能
- Highlight updates：查看重新渲染
- Components：检查状态和 props

### 4. 调试技巧

```tsx
// 追踪重新渲染
useEffect(() => {
  console.log('Component rendered', props)
})

// 追踪状态变化
useEffect(() => {
  console.log('State changed:', state)
}, [state])
```

## 💡 最佳实践总结

1. **状态更新** → 优先使用函数式更新
2. **useEffect** → 仔细检查依赖数组
3. **清理资源** → 总是返回清理函数
4. **性能优化** → 只在必要时使用 useMemo/useCallback
5. **类型安全** → 使用 TypeScript，避免 any
6. **代码审查** → 使用 ESLint 规则

记住：**React 的规则很清晰，但需要时刻注意！** 🚀

