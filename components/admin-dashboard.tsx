"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "./dashboard-layout"
import type { User } from "@/lib/auth"

interface AdminDashboardProps {
  user: User
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Format date: Saturday, February 22, 2025 at 05:15:07 PM
  const formattedDate = currentTime.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  // Mock data for dashboard
  const stats = {
    projects: 5,
    students: 20,
    tasks: 10,
    finishedProjects: 2,
  }

  return (
    <DashboardLayout user={user} activePage="home">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <h1 className="text-xl sm:text-3xl font-bold text-blue-400">Welcome to the Task Management System</h1>
        <div className="text-sm sm:text-base text-foreground">{formattedDate}</div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="rounded bg-card p-3 sm:p-6 text-center border border-border-color">
          <h2 className="mb-1 sm:mb-2 text-base sm:text-lg font-medium text-foreground">Number of Projects</h2>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.projects}</p>
        </div>
        <div className="rounded bg-card p-3 sm:p-6 text-center border border-border-color">
          <h2 className="mb-1 sm:mb-2 text-base sm:text-lg font-medium text-foreground">Number of Students</h2>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.students}</p>
        </div>
        <div className="rounded bg-card p-3 sm:p-6 text-center border border-border-color">
          <h2 className="mb-1 sm:mb-2 text-base sm:text-lg font-medium text-foreground">Number of Tasks</h2>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.tasks}</p>
        </div>
        <div className="rounded bg-card p-3 sm:p-6 text-center border border-border-color">
          <h2 className="mb-1 sm:mb-2 text-base sm:text-lg font-medium text-foreground">Number of Finished Projects</h2>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.finishedProjects}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded bg-card-background p-3 sm:p-4">
        <h2 className="mb-3 sm:mb-4 text-center text-lg sm:text-xl text-gray-200">Admin Dashboard Overview</h2>
        <div className="flex h-60 sm:h-80 items-end justify-center gap-4 sm:gap-8">
          <div className="relative flex h-[60%] w-16 sm:w-24 flex-col items-center">
            <div className="h-full w-full bg-blue-600/70"></div>
            <span className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-300">Projects</span>
          </div>
          <div className="relative flex h-[90%] w-16 sm:w-24 flex-col items-center">
            <div className="h-full w-full bg-green-600/70"></div>
            <span className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-300">Students</span>
          </div>
          <div className="relative flex h-[75%] w-16 sm:w-24 flex-col items-center">
            <div className="h-full w-full bg-yellow-600/70"></div>
            <span className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-300">Tasks</span>
          </div>
          <div className="relative flex h-[40%] w-16 sm:w-24 flex-col items-center">
            <div className="h-full w-full bg-purple-600/70"></div>
            <span className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-300">Completed</span>
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <div className="flex items-center gap-2">
            <div className="h-3 w-6 sm:w-8 bg-blue-500/70"></div>
            <span className="text-xs sm:text-sm text-gray-300">Count</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
