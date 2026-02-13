import { GlobalNav } from "@/components/layout/GlobalNav"
import { Sidebar } from "@/components/layout/Sidebar"
import { RightSidebar } from "@/components/layout/RightSidebar"
import { Footer } from "@/components/layout/Footer"
import { CopilotChat } from "@/components/dashboard/CopilotChat"
import { Feed } from "@/components/dashboard/Feed"
import { SidebarProvider } from "@/hooks/use-sidebar"

export function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
        <GlobalNav />

        <div className="flex min-h-[calc(100vh-4rem)]">
          {/* Sidebar */}
          <Sidebar />

          {/* Content Area */}
          <div className="min-w-0 flex-1 flex flex-col">
            <div className="mx-auto flex w-full max-w-7xl flex-1 items-start px-4 lg:px-6">
              {/* Main Content */}
              <main className="min-w-0 flex-1 py-6 px-6 lg:px-10">
                <h1 className="sr-only">Dashboard</h1>
                <h2 className="mb-4 text-base font-semibold text-[#e6edf3]">Home</h2>

                <CopilotChat />

                <div className="mt-6">
                  <Feed />
                </div>
              </main>

              {/* Right Sidebar */}
              <RightSidebar />
            </div>

            <Footer />
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
