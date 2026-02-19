import { useState } from "react";
import { ModeToggle } from "./components/mode-toggle";
import { ThemeProvider } from "./components/theme-provider";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import { Toaster } from "./components/ui/toaster";
import NotFound from "./NotFound";
import Landing from "./pages/Landing";

import Setup from "./pages/Setup";
import Learn from "./pages/Learn";
import Catalog from "./pages/Catalog";

// Responsive navbar with mobile menu
function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-background/95 backdrop-blur-md z-50 border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold">fkn</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          <Link
            to="/learn"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Lernen
          </Link>
          <Link
            to="/catalog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Katalog
          </Link>
          <Link
            to="/setup"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            KI Setup
          </Link>

          <ModeToggle />
        </nav>

        <div className="sm:hidden flex items-center gap-2">
          <ModeToggle />
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded-md border bg-card/60"
          >
            {open ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="sm:hidden bg-background/95 border-t border-border">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-2">
            <Link to="/learn" onClick={() => setOpen(false)} className="py-2">
              Lernen
            </Link>
            <Link to="/catalog" onClick={() => setOpen(false)} className="py-2">
              Katalog
            </Link>
            <Link to="/setup" onClick={() => setOpen(false)} className="py-2">
              KI Setup
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <LandingNavbar />
        <Routes>
          <Route path="/fkn" element={<Landing />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
