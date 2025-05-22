"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "./dashboard-layout"
import type { User } from "@/lib/auth"

interface StudentDashboardProps {
  user: User
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
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
    enrolledCourses: 3,
    completedAssignments: 8,
    pendingAssignments: 5,
    totalPoints: 85,
  }

  return (
    <DashboardLayout user={user} activePage="home">
      <div className="mb-4 sm:mb-6 flex flex-col items-start justify-between gap-2 sm:gap-4 md:flex-row md:items-center">
        <h1 className="text-xl sm:text-3xl font-bold text-primary">Welcome to the Student Portal</h1>
        <div className="text-sm sm:text-base text-foreground">{formattedDate}</div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 sm:mb-8 grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded bg-card p-3 sm:p-6 text-center border border-border-color">
          <h2 className="mb-1 sm:mb-2 text-base sm:text-lg font-medium text-foreground">Enrolled Courses</h2>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.enrolledCourses}</p>
        </div>
        <div className="rounded bg-card p-3 sm:p-6 text-center border border-border-color">
          <h2 className="mb-1 sm:mb-2 text-base sm:text-lg font-medium text-foreground">Completed Assignments</h2>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.completedAssignments}</p>
        </div>
        <div className="rounded bg-card p-3 sm:p-6 text-center border border-border-color">
          <h2 className="mb-1 sm:mb-2 text-base sm:text-lg font-medium text-foreground">Pending Assignments</h2>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.pendingAssignments}</p>
        </div>
        <div className="rounded bg-card p-3 sm:p-6 text-center border border-border-color">
          <h2 className="mb-1 sm:mb-2 text-base sm:text-lg font-medium text-foreground">Total Points</h2>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalPoints}</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
