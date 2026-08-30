"use client"

import { Menu, FileText, Users, ClipboardCheck, BookOpen, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header({ onMenuClick, onNotesClick }) {
  const pathname = usePathname()

  const navItems = [
    { name: "Group Chat", icon: Users, path: "/groupchat" },
    { name: "Quiz Time", icon: ClipboardCheck, path: "/quiz" },
    { name: "Games", icon: BookOpen, path: "/games" },
    { name: "To Do", icon: LayoutGrid, path: "/todo" },
  ]

  return (
    <header className="flex items-center justify-between border-b px-2 sm:px-4 py-2 sm:py-3 dark:border-zinc-800 min-h-[3.5rem]">
      {/* Left Section: Menu and Title only */}
      <div className="flex items-center gap-2 sm:gap-3 w-1/3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-1.5 sm:p-2 glass-icon-button lg:hidden flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-base sm:text-lg font-semibold whitespace-nowrap">
          Noodeia
        </h1>
      </div>

      {/* Center Section: Minimalist Icons Navigation */}
      <div className="hidden sm:flex items-center justify-center gap-2 w-1/3">
        <div className="flex items-center gap-1 bg-white/40 backdrop-blur-md px-2 py-1 rounded-2xl border border-white/40 shadow-sm">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <div key={item.path} className="relative group flex items-center justify-center">
                <Link 
                  href={item.path}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-white/80 text-[var(--noodeia-primary)] shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-800 hover:bg-white/50"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
                {/* Tooltip */}
                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-zinc-800 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                  {item.name}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right Section: Notes button */}
      <div className="flex items-center justify-end gap-2 w-1/3">
        <button
          onClick={onNotesClick}
          className="rounded-xl p-1.5 sm:p-2 glass-icon-button flex-shrink-0"
          aria-label="Open notes"
          title="Notes & Mindmap"
        >
          <FileText className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}