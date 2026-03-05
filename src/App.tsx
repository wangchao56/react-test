// 根据使用的状态管理库选择对应的组件
// MST 版本：使用 TodoListMST
// Redux 版本：使用 TodoList

// 当前使用 MST 版本
import BigDipper from './components/BigDipper'
// 如果要使用 Redux 版本，改为：
// import { TodoList } from './components'

import './App.css'
import StarSky from './components/StarSky'
import AdvancedStarrySky from './components/AdvancedStarrySky'
function App() {
  return (
    <div className="app">
      {/* <BigDipper /> */}
      {/* <StarSky/> */}
      <AdvancedStarrySky/>
    </div>
  )
}

export default App
