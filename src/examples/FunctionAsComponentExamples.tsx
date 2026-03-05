/**
 * React "函数即组件" 的实际应用示例
 */

import { useState, useMemo, ComponentType } from 'react'

// ============================================
// 示例 1: 函数作为组件使用
// ============================================

// 普通函数返回 JSX
function renderHeader(title: string) {
  return <h1>{title}</h1>
}

function renderFooter(text: string) {
  return <footer>{text}</footer>
}

// 在组件中使用这些函数
export function FunctionAsComponent() {
  return (
    <div>
      {renderHeader('欢迎')}
      <main>内容</main>
      {renderFooter('版权所有')}
    </div>
  )
}

// ============================================
// 示例 2: 组件工厂模式
// ============================================

// 根据类型创建不同的按钮组件
function createButton(variant: 'primary' | 'secondary' | 'danger') {
  // 返回一个组件函数
  return function Button({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) {
    const className = `btn btn-${variant}`
    return (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    )
  }
}

// 使用工厂函数创建组件
export const PrimaryButton = createButton('primary')
export const SecondaryButton = createButton('secondary')
export const DangerButton = createButton('danger')

// 它们都是正常的组件！
export function ButtonExample() {
  return (
    <div>
      <PrimaryButton onClick={() => console.log('保存')}>保存</PrimaryButton>
      <SecondaryButton onClick={() => console.log('取消')}>取消</SecondaryButton>
      <DangerButton onClick={() => console.log('删除')}>删除</DangerButton>
    </div>
  )
}

// ============================================
// 示例 3: 动态组件选择
// ============================================

interface RendererProps {
  type: 'text' | 'image' | 'video'
  data: any
}

// 不同类型的渲染组件
function TextRenderer({ data }: { data: string }) {
  return <div className="text-renderer">{data}</div>
}

function ImageRenderer({ data }: { data: { src: string; alt: string } }) {
  return <img src={data.src} alt={data.alt} />
}

function VideoRenderer({ data }: { data: { src: string } }) {
  return <video src={data.src} controls />
}

// 动态选择组件
export function DynamicRenderer({ type, data }: RendererProps) {
  // 组件映射表
  const components = {
    text: TextRenderer,
    image: ImageRenderer,
    video: VideoRenderer,
  }

  // Component 是一个函数，可以像组件一样使用
  const Component = components[type] || TextRenderer

  return <Component data={data} />
}

// ============================================
// 示例 4: 组件作为 props 传递
// ============================================

interface LayoutProps {
  header: ComponentType
  sidebar: ComponentType
  content: ComponentType
}

export function Layout({
  header: Header,
  sidebar: Sidebar,
  content: Content,
}: LayoutProps) {
  return (
    <div className="layout">
      <Header />
      <Sidebar />
      <Content />
    </div>
  )
}

// 定义不同的组件
function MyHeader() {
  return <header className="header">网站标题</header>
}

function MySidebar() {
  return <aside className="sidebar">侧边栏</aside>
}

function MyContent() {
  return <main className="content">主要内容</main>
}

// 使用：传递组件作为 props
export function LayoutExample() {
  return (
    <Layout
      header={MyHeader} // ✅ 组件作为 prop
      sidebar={MySidebar}
      content={MyContent}
    />
  )
}

// ============================================
// 示例 5: 组件数组
// ============================================

// 组件可以是数组元素
const pageComponents = [
  () => <section>首页</section>,
  () => <section>关于</section>,
  () => <section>联系</section>,
]

export function ComponentArray() {
  const [currentPage, setCurrentPage] = useState(0)
  const PageComponent = pageComponents[currentPage]

  return (
    <div>
      <nav>
        {pageComponents.map((_, index) => (
          <button key={index} onClick={() => setCurrentPage(index)}>
            页面 {index + 1}
          </button>
        ))}
      </nav>
      <PageComponent /> {/* ✅ 渲染选中的组件 */}
    </div>
  )
}

// ============================================
// 示例 6: 组件组合器
// ============================================

// 组合多个组件
function composeComponents(...components: ComponentType[]) {
  return function Composed({ children }: { children: React.ReactNode }) {
    return components.reduceRight(
      (acc, Component) => <Component>{acc}</Component>,
      children
    )
  }
}

// 装饰器组件
function withPadding({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '20px' }}>{children}</div>
}

function withBorder({ children }: { children: React.ReactNode }) {
  return <div style={{ border: '1px solid #ccc' }}>{children}</div>
}

function withBackground({ children }: { children: React.ReactNode }) {
  return <div style={{ backgroundColor: '#f5f5f5' }}>{children}</div>
}

// 组合创建新组件
export const StyledBox = composeComponents(
  withBackground,
  withBorder,
  withPadding
)

export function ComposedComponentExample() {
  return (
    <StyledBox>
      <p>这是一个组合的组件</p>
    </StyledBox>
  )
}

// ============================================
// 示例 7: Hook 返回组件
// ============================================

export function useModal() {
  const [isOpen, setIsOpen] = useState(false)

  // Hook 返回一个组件！
  const Modal = ({ children }: { children: React.ReactNode }) => {
    if (!isOpen) return null

    return (
      <div className="modal-overlay" onClick={() => setIsOpen(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setIsOpen(false)}>×</button>
          {children}
        </div>
      </div>
    )
  }

  return {
    Modal, // ✅ 返回组件
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    isOpen,
  }
}

export function ModalExample() {
  const { Modal, open } = useModal()

  return (
    <div>
      <button onClick={open}>打开模态框</button>
      <Modal>
        <h2>模态框内容</h2>
        <p>这是从 Hook 返回的组件</p>
      </Modal>
    </div>
  )
}

// ============================================
// 示例 8: 递归组件
// ============================================

interface TreeNode {
  label: string
  children?: TreeNode[]
}

// 组件可以调用自己（递归）
export function Tree({ node }: { node: TreeNode }) {
  return (
    <div className="tree-node">
      <div>{node.label}</div>
      {node.children && (
        <div className="tree-children">
          {node.children.map((child, index) => (
            <Tree key={index} node={child} /> // ✅ 组件递归调用自己
          ))}
        </div>
      )}
    </div>
  )
}

// 使用
export function TreeExample() {
  const treeData: TreeNode = {
    label: '根节点',
    children: [
      { label: '子节点 1' },
      {
        label: '子节点 2',
        children: [
          { label: '子子节点 1' },
          { label: '子子节点 2' },
        ],
      },
    ],
  }

  return <Tree node={treeData} />
}

// ============================================
// 示例 9: 配置驱动的组件生成
// ============================================

interface TodoItemConfig {
  showTags?: boolean
  showDate?: boolean
  showPriority?: boolean
}

function createTodoItem(config: TodoItemConfig) {
  return function TodoItem({ todo }: { todo: any }) {
    return (
      <div className="todo-item">
        <h3>{todo.title}</h3>
        {config.showTags && todo.tags && (
          <div className="tags">
            {todo.tags.map((tag: string) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
        {config.showDate && todo.dueDate && (
          <div className="date">📅 {todo.dueDate}</div>
        )}
        {config.showPriority && (
          <div className="priority">优先级: {todo.priority}</div>
        )}
      </div>
    )
  }
}

// 使用配置创建不同的组件
export const CompactTodoItem = createTodoItem({})
export const FullTodoItem = createTodoItem({
  showTags: true,
  showDate: true,
  showPriority: true,
})

export function ConfigurableComponentExample() {
  const todo = {
    title: '完成项目',
    tags: ['工作', '重要'],
    dueDate: '2024-01-01',
    priority: 'high',
  }

  return (
    <div>
      <h3>简洁版：</h3>
      <CompactTodoItem todo={todo} />
      <h3>完整版：</h3>
      <FullTodoItem todo={todo} />
    </div>
  )
}

// ============================================
// 示例 10: 组件缓存（高级）
// ============================================

const componentCache = new Map<string, React.ReactElement>()

function getCachedComponent(
  type: string,
  props: Record<string, any>
): React.ReactElement {
  const key = `${type}-${JSON.stringify(props)}`

  if (!componentCache.has(key)) {
    // 根据 type 创建组件
    const Component = type === 'button' ? 'button' : 'div'
    componentCache.set(key, <Component {...props} />)
  }

  return componentCache.get(key)!
}

export function ComponentCacheExample() {
  return (
    <div>
      {getCachedComponent('button', { children: '点击', className: 'btn' })}
    </div>
  )
}

// ============================================
// 示例 11: Render Props 模式
// ============================================

interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode // 函数返回 JSX
}

export function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

export function RenderPropsExample() {
  const todos = [
    { id: 1, title: 'Todo 1', completed: false },
    { id: 2, title: 'Todo 2', completed: true },
  ]

  return (
    <List
      items={todos}
      renderItem={(todo) => (
        <div>
          <input type="checkbox" checked={todo.completed} readOnly />
          <span>{todo.title}</span>
        </div>
      )}
    />
  )
}

// ============================================
// 示例 12: 条件组件创建
// ============================================

export function ConditionalComponentExample({ mode }: { mode: 'edit' | 'view' }) {
  // 根据条件创建不同的组件
  const TodoItem = mode === 'edit'
    ? ({ todo }: { todo: any }) => (
        <div>
          <input defaultValue={todo.title} />
          <button>保存</button>
        </div>
      )
    : ({ todo }: { todo: any }) => (
        <div>
          <span>{todo.title}</span>
          <button>编辑</button>
        </div>
      )

  const todo = { title: '示例任务' }

  return <TodoItem todo={todo} />
}

// ============================================
// 示例 13: 高阶组件（HOC）
// ============================================

// HOC 是一个函数，接受组件，返回新组件
function withLoading<P extends object>(
  Component: ComponentType<P>
): ComponentType<P & { isLoading?: boolean }> {
  return function WithLoading({ isLoading, ...props }: P & { isLoading?: boolean }) {
    if (isLoading) {
      return <div>加载中...</div>
    }
    return <Component {...(props as P)} />
  }
}

function TodoList({ todos }: { todos: any[] }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}

// 使用 HOC 创建新组件
export const TodoListWithLoading = withLoading(TodoList)

export function HOCExample() {
  return <TodoListWithLoading todos={[]} isLoading={true} />
}

// ============================================
// 示例 14: 组件装饰器链
// ============================================

type ComponentDecorator = <P extends object>(
  Component: ComponentType<P>
) => ComponentType<P>

// 组合多个装饰器
function composeDecorators(...decorators: ComponentDecorator[]) {
  return function <P extends object>(Component: ComponentType<P>) {
    return decorators.reduceRight(
      (AccumulatedComponent, decorator) => decorator(AccumulatedComponent),
      Component
    )
  }
}

// 装饰器示例
const withLogging: ComponentDecorator = (Component) => {
  return function LoggedComponent(props: any) {
    console.log('Component rendered:', Component.name)
    return <Component {...props} />
  }
}

const withErrorBoundary: ComponentDecorator = (Component) => {
  return function ErrorBoundedComponent(props: any) {
    try {
      return <Component {...props} />
    } catch (error) {
      return <div>出错了: {String(error)}</div>
    }
  }
}

// 组合装饰器
const withAll = composeDecorators(withLogging, withErrorBoundary)

export const EnhancedTodoList = withAll(TodoList)

// ============================================
// 示例 15: 在你的项目中的应用
// ============================================

// 根据状态管理库选择组件
function createTodoListComponent(storeType: 'mst' | 'redux') {
  if (storeType === 'mst') {
    // 返回 MST 版本的组件
    return function TodoList() {
      // const store = useMSTStore()
      return <div>MST TodoList</div>
    }
  } else {
    // 返回 Redux 版本的组件
    return function TodoList() {
      // const store = useReduxStore()
      return <div>Redux TodoList</div>
    }
  }
}

export const MSTTodoList = createTodoListComponent('mst')
export const ReduxTodoList = createTodoListComponent('redux')

