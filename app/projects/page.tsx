import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import ProjectsPage from "@/components/projects-page"
import StudentProjectsPage from "@/components/student-projects-page"

export default async function ProjectsRoute() {
  const user = await getSession()

  if (!user) {
    redirect("/signin")
  }

  if (user.role === "admin") {
    return <ProjectsPage user={user} />
  } else if (user.role === "student") {
    return <StudentProjectsPage user={user} />
  } else {
    redirect("/dashboard")
  }
}
