import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import StudentTasksPage from "@/components/student-tasks-page"

export default async function StudentTasksRoute() {
  const user = await getSession()

  if (!user) {
    redirect("/signin")
  }

  if (user.role !== "student") {
    redirect("/dashboard")
  }

  return <StudentTasksPage user={user} />
}
