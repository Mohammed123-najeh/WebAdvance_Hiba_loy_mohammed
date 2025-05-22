"use client"

import { formatDate } from "@/lib/utils"

interface Student {
  id: number
  username: string
}

interface Category {
  id: number
  name: string
}

interface Project {
  id: number
  title: string
  description: string
  category: Category
  start_date: string
  end_date: string
  status: string
  progress: number
  students: Student[]
}

interface Task {
  id: number
  name: string
  description: string
  status: string
  due_date: string
  student: {
    id: number
    username: string
  } | null
}

interface ProjectDetailsPanelProps {
  project: Project
  tasks: Task[]
  loading: boolean
  onClose: () => void
  isMobile?: boolean
}

export default function ProjectDetailsPanel({
  project,
  tasks,
  loading,
  onClose,
  isMobile = false,
}: ProjectDetailsPanelProps) {
  return (
    <div className={isMobile ? "w-full" : "w-full"}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-400">{project.title}</h2>
        {!isMobile && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      <div className="bg-[#222] rounded-lg p-4 mb-6">
        <div className="mb-3">
          <p className="text-gray-400 mb-1">Description:</p>
          <p>{project.description}</p>
        </div>

        <div className="mb-3">
          <p className="text-gray-400 mb-1">Category:</p>
          <p>{project.category?.name}</p>
        </div>

        <div className="mb-3">
          <p className="text-gray-400 mb-1">Students:</p>
          <p>{project.students.map((student) => student.username).join(", ")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="mb-3">
            <p className="text-gray-400 mb-1">Start Date:</p>
            <p>{formatDate(project.start_date)}</p>
          </div>

          <div className="mb-3">
            <p className="text-gray-400 mb-1">End Date:</p>
            <p>{formatDate(project.end_date)}</p>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-blue-400 mb-4">Tasks</h3>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-[#222] rounded-lg p-4 text-center text-gray-400">No tasks found for this project</div>
      ) : (
        <div className="space-y-4 pb-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-[#222] rounded-lg p-4 border border-[#444]">
              <div className="mb-2">
                <p className="text-gray-400 text-sm">Task ID: {task.id}</p>
              </div>

              <div className="mb-2">
                <p className="text-gray-400 mb-1">Task Name:</p>
                <p className="font-medium">{task.name}</p>
              </div>

              <div className="mb-2">
                <p className="text-gray-400 mb-1">Description:</p>
                <p>{task.description}</p>
              </div>

              <div className="mb-2">
                <p className="text-gray-400 mb-1">Assigned Student:</p>
                <p>{task.student ? task.student.username : "Unassigned"}</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                <div>
                  <p className="text-gray-400 mb-1">Status:</p>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      task.status === "Completed"
                        ? "bg-green-500/20 text-green-400"
                        : task.status === "In Progress"
                          ? "bg-blue-500/20 text-blue-400"
                          : task.status === "On Hold"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">Due Date:</p>
                  <p>{formatDate(task.due_date)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
