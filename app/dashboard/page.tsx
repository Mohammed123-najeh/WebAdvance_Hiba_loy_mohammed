import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import AdminDashboard from "@/components/admin-dashboard"
import StudentDashboard from "@/components/student-dashboard"

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    redirect("/signin")
  }

  return <>{user.role === "admin" ? <AdminDashboard user={user} /> : <StudentDashboard user={user} />}</>
}
