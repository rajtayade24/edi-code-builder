import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/Sonner";
import AppContent from "@/AppContent";
import ErrorBoundary from "@/components/ErrorBoundary";
import useAuthStore from "@/store/useAuthStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  const darkMode = useAuthStore((state) => state.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Sonner theme={darkMode ? "dark" : "light"} />
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
