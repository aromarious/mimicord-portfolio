import { Bot, Code, Home, MessageSquare, Plus } from "lucide-react"
import type React from "react"

const Sidebar: React.FC = () => {
  const servers = [
    { id: 1, name: "Home", icon: Home, active: true },
    { id: 2, name: "AI Lab", icon: Bot },
    { id: 3, name: "Dev", icon: Code },
    { id: 4, name: "Social", icon: MessageSquare },
  ]

  return (
    <div className="w-[72px] bg-[#202225] flex flex-col items-center py-3 gap-2 shrink-0">
      {servers.map((server) => (
        <div key={server.id} className="relative group">
          {server.active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full"></div>
          )}
          <div
            className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 
              ${
                server.active
                  ? "bg-[#5865f2] rounded-[16px] text-white"
                  : "bg-[#36393f] rounded-[24px] hover:rounded-[16px] hover:bg-[#5865f2] hover:text-white text-[#dcddde]"
              }`}
            title={server.name}
          >
            <server.icon size={24} />
          </div>
        </div>
      ))}
      <div className="w-8 h-[2px] bg-[#36393f] rounded-full my-1"></div>
      <div className="w-12 h-12 flex items-center justify-center cursor-pointer bg-[#36393f] rounded-[24px] hover:rounded-[16px] hover:bg-[#3ba55d] hover:text-white text-[#3ba55d] transition-all duration-200">
        <Plus size={24} />
      </div>
    </div>
  )
}

export default Sidebar
