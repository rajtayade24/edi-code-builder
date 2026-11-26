import { motion } from "framer-motion";
import { Link } from 'react-router-dom'
import { ArrowRight, FileText, LogIn, ShieldCheck, Sparkles, ClipboardList, MapPin, AlertCircle, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const highlights = [
    {
      title: "Complaint Tracking",
      value: "Live",
      desc: "Monitor complaint status in real time.",
    },
    {
      title: "Scheme Filtering",
      value: "Smart",
      desc: "Find relevant schemes faster.",
    },
    {
      title: "Public Trust",
      value: "High",
      desc: "Clean, transparent service flow.",
    },
  ];

  const features = [
    {
      title: "File Complaint",
      desc: "Submit text, image, and geo-tagged complaints in one place.",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Track Status",
      desc: "See Open, In Progress, and Resolved updates clearly.",
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      title: "Check Eligibility",
      desc: "Enter your details and get relevant government schemes.",
      icon: <BadgeCheck className="h-5 w-5" />,
    },
  ];


  return (

    < main className=" container px-4 py-12 sm:px-6 lg:px-8 lg:py-16" >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="space-y-5">
            <Badge className="inline-flex rounded-full px-4 py-1.5 text-sm font-medium shadow-sm">
              <Sparkles className="mr-2 h-4 w-4" />
              Smart Citizen Support Platform
            </Badge>

            <div className="space-y-4">
              <h2 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-tight">
                AI-powered Public Complaint & Scheme Assistance Portal
              </h2>

              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Register public complaints, track resolution status, and check government scheme eligibility through one trusted digital platform designed for citizens, officers, and administrators.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button size="lg" className="h-14 rounded-2xl px-6 text-base shado1w-sm" asChild >
                <Link to="/complaint">
                  <FileText className="mr-2 h-5 w-5" />
                  Register Complaint
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-2xl border-slate-300 bg-white px-6 text-base shadow-sm hover:bg-slate-50"
              >
                <ClipboardList className="mr-2 h-5 w-5" />
                Check Scheme Eligibility
              </Button>
            </motion.div>
          </div>

          <div className="grid gap-4 pt-2 sm:grid-cols-3">
            {highlights.map((item) => (
              <Card
                key={item.title}
                className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {item.title}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-3 h-px w-full bg-slate-200" />

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Right side visual panel */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white/95 shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Welcome to</p>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                    Citizen Service Dashboard
                  </h3>
                </div>
                <div className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm">
                  AI Enabled
                </div>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Complaint Services</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">File, classify, track</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Scheme Services</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">Filter, verify, apply</p>
                </div>
              </div>

              <div className="space-y-4">
                {features.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.15 * index }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-shadow hover:shadow-sm">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Designed for clarity and trust
                </div>
                <p className="mt-2 leading-6">
                  Citizens can file complaints, track progress, and check scheme eligibility from one clean interface without confusing navigation.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </main >

  );
}
