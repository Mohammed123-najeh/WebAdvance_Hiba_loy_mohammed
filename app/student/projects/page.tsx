import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import StudentProjectsPage from "@/components/student-projects-page"

export default async function StudentProjectsRoute() {
  const user = await getSession()

  if (!user) {
    redirect("/signin")
  }

  if (user.role !== "student") {
    redirect("/dashboard")
  }

  return <StudentProjectsPage user={user} />
}
