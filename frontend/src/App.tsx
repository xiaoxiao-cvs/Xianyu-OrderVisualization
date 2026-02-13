import { DashboardPage } from "@/pages/DashboardPage"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  return (
    <TooltipProvider>
      <DashboardPage />
    </TooltipProvider>
  )
}

export default App
