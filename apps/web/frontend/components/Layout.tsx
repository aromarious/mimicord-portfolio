"use client"

import { Bell, Hash, Loader2, LogOut, Menu, X } from "lucide-react"
import Image from "next/image"
import type React from "react"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import Sidebar from "./Sidebar"

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { data: session, isPending } = authClient.useSession()

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.reload()
        },
      },
    })
  }

  return (
    <div className="flex h-screen w-full select-none bg-[#36393f] overflow-hidden">
      {/* Persistent Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile/Channel Drawer */}
      <aside
        className={`
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 transition-transform duration-300
        w-60 bg-[#2f3136] flex flex-col shrink-0 z-20 absolute inset-y-0 left-0 md:relative
      `}
      >
        <div className="h-12 flex items-center px-4 shadow-sm border-b border-[#202225] font-bold text-white justify-between">
          <span className="truncate pr-2">Mimicord</span>
          <button
            type="button"
            className="md:hidden p-1 hover:bg-[#36393f] rounded"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto pt-4 px-2">
          <div className="text-[#8e9297] text-xs font-bold uppercase px-2 mb-2 tracking-widest">
            Text Channels
          </div>
          <div className="flex items-center px-2 py-2 rounded bg-[#4f545c] text-white cursor-pointer group">
            <Hash size={20} className="text-[#8e9297] mr-2 shrink-0" />
            <span className="font-medium truncate">general-aromarious</span>
          </div>
        </nav>

        {/* User Profile Area */}
        <div className="relative">
          {/* Sign Out Menu Popover */}
          {isUserMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-10 cursor-default bg-transparent"
                onClick={() => setIsUserMenuOpen(false)}
              ></button>
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#18191c] rounded-md shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-[#ed4245] hover:bg-[#ed4245] hover:text-white transition-colors group/logout"
                >
                  <span>Log Out</span>
                  <LogOut
                    size={16}
                    className="text-[#ed4245] group-hover/logout:text-white"
                  />
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="bg-[#292b2f] h-14 w-full flex items-center px-2 gap-2 group/user cursor-pointer hover:bg-[#393c43] transition-colors text-left"
          >
            <div className="relative shrink-0">
              {isPending ? (
                <div className="w-8 h-8 rounded-full bg-[#36393f] flex items-center justify-center">
                  <Loader2 size={16} className="text-[#b9bbbe] animate-spin" />
                </div>
              ) : (
                <>
                  <Image
                    src={
                      session?.user.image ||
                      "https://picsum.photos/seed/user/100/100"
                    }
                    className="w-8 h-8 rounded-full"
                    alt="User Avatar"
                    width={32}
                    height={32}
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#3ba55d] border-2 border-[#292b2f] rounded-full"></div>
                </>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold text-white truncate leading-tight">
                {isPending
                  ? "Connecting..."
                  : session?.user.name || "Guest User"}
              </span>
              <span className="text-[10px] text-[#b9bbbe] truncate leading-tight">
                #{session?.user.id.slice(-4) || "0001"}
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-12 flex items-center px-4 shadow-sm border-b border-[#202225] bg-[#36393f] z-10 shrink-0">
          <button
            type="button"
            className="md:hidden text-[#8e9297] mr-3 p-1 hover:bg-[#32353b] rounded"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-1 font-bold text-white flex-1 min-w-0">
            <Hash size={24} className="text-[#8e9297] shrink-0" />
            <span className="truncate">general-aromarious</span>
          </div>
          <div className="flex items-center gap-4 text-[#b9bbbe] ml-2">
            <Bell size={20} className="cursor-pointer hover:text-[#dcddde]" />
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}

export default Layout
