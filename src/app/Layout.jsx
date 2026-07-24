import Sidebar from "../components/layout/Sidebar"

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">

      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>

    </div>
  )
}

export default Layout
