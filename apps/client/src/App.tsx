import { Route } from "wouter"
import { Jobs } from "./pages/Jobs"

function App() {

  return (
    // <div className="font-mono items-center justify-end flex h-screen">
    //   <div className="w-2/3 bg-neutral-700 h-full">
    //     <iframe title="chatbot" src="https://vetro-e5ctydhvt-prasads-projects-ceb5fc1e.vercel.app/" className="w-full h-full"></iframe>
    //   </div>
    // </div>
    <div className=" min-h-screen w-full">
      <Route path="/jobs" component={Jobs}></Route>
    </div>
  )
}

export default App
