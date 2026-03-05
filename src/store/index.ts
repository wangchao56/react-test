import { TodoStore } from './stores/TodoStore'
import { onSnapshot } from 'mobx-state-tree'

// 创建全局 store 实例
export const rootStore = TodoStore.create({
  todos: [],
  filter: 'all',
  sortBy: 'created',
  searchQuery: '',
  selectedCategory: '',
})

// 加载本地存储的数据
rootStore.loadFromLocalStorage()

// 监听 store 变化并保存到 localStorage
onSnapshot(rootStore, (snapshot) => {
  rootStore.saveToLocalStorage()
})

// 导出类型
export type RootStore = typeof rootStore

