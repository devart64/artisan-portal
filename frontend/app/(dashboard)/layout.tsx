import { redirect } from 'next/navigation'
import { getJwt } from '@/lib/auth'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jwt = await getJwt()
  if (!jwt) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <Header />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
