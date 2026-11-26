import AuthenticatedNavbar from '@/components/AuthenticatedNavbar'
import Navbar from '@/components/Navbar'
import useAuthStore from '@/store/useAuthStore'
import React from 'react'
import { Outlet } from 'react-router-dom'

const PublicLayout = () => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/60 to-white text-slate-900">

      {!isAuthenticated ? (
        <Navbar />
      ) : (
        <AuthenticatedNavbar />
      )}

      <Outlet />

    </div>
  )
}

export default PublicLayout
