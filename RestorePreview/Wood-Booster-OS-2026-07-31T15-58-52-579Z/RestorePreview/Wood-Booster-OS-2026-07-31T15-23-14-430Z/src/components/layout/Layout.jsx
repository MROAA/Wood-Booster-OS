import Sidebar from "./Sidebar"
import WorkspaceHeader from "./WorkspaceHeader"


function Layout({
  children
}) {

  return (

    <div className="app-container">


      <Sidebar />


      <main className="main-content">


        <WorkspaceHeader />


        <div className="workspace fade-in">

          {children}

        </div>


      </main>


    </div>

  )

}


export default Layout
