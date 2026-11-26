import AuthenticatedNavbar from '@/components/AuthenticatedNavbar'
import React from 'react'
import { Outlet } from 'react-router-dom'

const CitizenLoyout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/60 to-white text-slate-900">

      <AuthenticatedNavbar />

      <Outlet />

    </div>
  )
}

export default CitizenLoyout
