import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  const MotionDiv = motion.div;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-blue-50 to-white px-4">
      <MotionDiv
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-3xl border border-slate-200 bg-white shadow-lg">
          <CardContent className="p-8 text-center">

            {/* Icon */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-7 w-7" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-slate-900">
              404 - Page Not Found
            </h1>

            {/* Description */}
            <p className="mt-3 text-sm text-slate-600 leading-6">
              The page you are looking for does not exist or may have been moved.
              Please check the URL or navigate back to a safe page.
            </p>

            {/* Buttons */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">

              <Button
                onClick={() => navigate("/")}
                className="rounded-xl px-5"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="rounded-xl px-5"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>

            </div>

          </CardContent>
        </Card>
      </MotionDiv>
    </div>
  );
}