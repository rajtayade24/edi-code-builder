import React from "react";
import { motion } from "framer-motion";

import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  LogIn,
  UserPlus,
  ShieldCheck,
  User,
  Building2,
  Shield,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const roles = [
  {
    title: "Citizen",
    description: "Register complaints and check government scheme eligibility.",
    icon: <User className="h-5 w-5" />,
    accent: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    title: "Department Officer",
    description: "Handle assigned complaints and update resolution status.",
    icon: <Building2 className="h-5 w-5" />,
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    title: "Department Admin",
    description: "Monitor complaints, officers, and portal analytics.",
    icon: <Shield className="h-5 w-5" />,
    accent: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export default function Unauthenticated() {
  const handleLogin = () => {
    console.log("Navigate to login");
  };

  const handleRegister = () => {
    console.log("Navigate to register");
  };

  return (
    <div className="min-h-screen  bg-gradient-to-b from-slate-50 via-blue-50/70 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className=" flex container items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <Link to="/">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                  Public Service Portal
                </h1>
                <p className="text-xs text-slate-500 sm:text-sm">
                  AI-powered complaint and scheme assistance platform
                </p>
              </div>
            </div>
          </Link>

          <Button
            onClick={handleLogin}
            variant="outline"
            className="rounded-xl border-slate-300 bg-white shadow-sm"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        </div>
      </header>

      <main className=" container px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            <Badge className="rounded-full px-4 py-2 text-sm font-medium">
              <ShieldAlert className="mr-2 h-4 w-4" />
              You are not logged in
            </Badge>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600 shadow-sm">
              <Lock className="h-7 w-7" />
            </div>

            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Authentication required
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Please login or create an account to access complaint submission, complaint tracking,
              scheme eligibility checking, and department dashboards.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button onClick={handleLogin} className="h-12 rounded-xl px-6 shadow-sm">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
              <Button
                onClick={handleRegister}
                variant="outline"
                className="h-12 rounded-xl border-slate-300 px-6 shadow-sm"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Register
              </Button>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {roles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 * index }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full rounded-3xl border-slate-200 bg-white shadow-lg transition-shadow hover:shadow-xl">
                <CardContent className="space-y-5 p-6 sm:p-7">
                  <div className={`flex items-center justify-between rounded-2xl border px-4 py-4 ${role.accent}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                        {role.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium opacity-80">Access for</p>
                        <h3 className="text-lg font-semibold">{role.title}</h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-slate-600">{role.description}</p>

                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    Login is required to continue into the {role.title.toLowerCase()} dashboard.
                  </div>

                  <Button
                    onClick={handleLogin}
                    className="h-11 w-full rounded-xl shadow-sm"
                  >
                    Continue as {role.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Citizen Access</p>
              <p className="mt-1 text-lg font-semibold">File and track complaints</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Scheme Access</p>
              <p className="mt-1 text-lg font-semibold">Check eligibility and apply</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Secure Access</p>
              <p className="mt-1 text-lg font-semibold">Role-based authentication</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
