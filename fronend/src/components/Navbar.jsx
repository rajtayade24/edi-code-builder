import { motion } from "framer-motion";
import { LogIn, ShieldCheck } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="container">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                  Public Service Portal
                </h1>
                <p className="text-xs text-slate-500 sm:text-sm">
                  AI-powered grievance and scheme access
                </p>
              </div>
            </motion.div>
          </Link>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button className="rounded-full px-5 shadow-sm" variant="default" asChild>
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;