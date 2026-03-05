import { observer } from 'mobx-react-lite'
import { useStore } from '../store/StoreContext'
import './TodoFilters.css'

// 基础组件（不带 observer，用于 Redux Toolkit）
export const TodoFilters = () => {
  const store = useStore()

  return (
    <div className="todo-filters">
      <div className="filter-group">
        <label>状态筛选:</label>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${store.filter === 'all' ? 'active' : ''}`}
            onClick={() => store.setFilter('all')}
          >
            全部 ({store.totalTodosCount})
          </button>
          <button
            className={`filter-btn ${store.filter === 'active' ? 'active' : ''}`}
            onClick={() => store.setFilter('active')}
          >
            待办 ({store.activeTodosCount})
          </button>
          <button
            className={`filter-btn ${store.filter === 'completed' ? 'active' : ''}`}
            onClick={() => store.setFilter('completed')}
          >
            已完成 ({store.completedTodosCount})
          </button>
        </div>
      </div>

      <div className="filter-group">
        <label>排序方式:</label>
        <select
          className="sort-select"
          value={store.sortBy}
          onChange={(e) =>
            store.setSortBy(e.target.value as 'created' | 'priority' | 'dueDate' | 'title')
          }
        >
          <option value="created">创建时间</option>
          <option value="priority">优先级</option>
          <option value="dueDate">截止日期</option>
          <option value="title">标题</option>
        </select>
      </div>

      <div className="filter-group">
        <label>搜索:</label>
        <input
          type="text"
          className="search-input"
          placeholder="搜索任务..."
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
        />
      </div>

      {store.categories.length > 0 && (
        <div className="filter-group">
          <label>分类筛选:</label>
          <div className="category-buttons">
            <button
              className={`filter-btn ${store.selectedCategory === '' ? 'active' : ''}`}
              onClick={() => store.setSelectedCategory('')}
            >
              全部
            </button>
            {store.categories.map((category) => (
              <button
                key={category}
                className={`filter-btn ${
                  store.selectedCategory === category ? 'active' : ''
                }`}
                onClick={() => store.setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// MST 版本（带 observer，用于 MobX State Tree）
export const TodoFiltersMST = observer(TodoFilters)

