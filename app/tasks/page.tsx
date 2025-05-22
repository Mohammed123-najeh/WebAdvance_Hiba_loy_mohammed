import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import TasksPage from "@/components/tasks-page"
import StudentTasksPage from "@/components/student-tasks-page"

export default async function TasksRoute() {
  const user = await getSession()

  if (!user) {
    redirect("/signin")
  }

  if (user.role === "admin") {
    return <TasksPage user={user} />
  } else if (user.role === "student") {
    return <StudentTasksPage user={user} />
  } else {
    redirect("/dashboard")
  }
}
