"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X, Music, Music2 } from "lucide-react";
import { AshokaChakra } from "./AshokaChakra";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "freedom", label: "Our Freedom" },
  { id: "fighters", label: "Freedom Fighters" },
  { id: "journey", label: "The Journey" },
  { id: "timeline", label: "India Through Time" },
  { id: "quiz", label: "Interactive Quiz" },
  { id: "today", label: "India Today" },
  { id: "finale", label: "Finale" },
];

interface NavbarProps {
  musicOn: boolean;
  onToggleMusic: () => void;
}

export function Navbar({ musicOn, onToggleMusic }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "py-2" : "py-3"
        }`}
      >
        <div
          className={`mx-3 sm:mx-4 lg:mx-6 rounded-2xl ${
            scrolled ? "glass-strong shadow-2xl" : "bg-transparent"
          } transition-all duration-500`}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
            {/* Logo */}
            <button
              onClick={() => scrollTo("home")}
              className="flex items-center gap-3 group"
              aria-label="Go to home"
            >
              <div className="text-chakra-blue-light group-hover:text-saffron transition-colors">
                <AshokaChakra size={28} spinDuration={20} />
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-serif font-bold text-sm tracking-wider gold-text">
                  INDIA
                </div>
                <div className="font-deva text-[10px] text-white/60 leading-none">
                  भारत
                </div>
              </div>
            </button>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`relative px-3 py-2 text-xs font-medium tracking-wide rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="navActive"
                      className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-saffron/30 via-white/20 to-india-green/30 border border-gold/30"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMusic}
                aria-label={musicOn ? "Mute music" : "Play music"}
                className="relative p-2.5 rounded-full glass hover:bg-white/10 transition-colors text-gold"
              >
                {musicOn ? (
                  <Music2 size={16} className="animate-pulse" />
                ) : (
                  <Music size={16} />
                )}
                {musicOn && (
                  <span className="absolute inset-0 rounded-full border border-gold/50 animate-ping" />
                )}
              </button>

              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="lg:hidden p-2.5 rounded-full glass hover:bg-white/10 transition-colors text-white"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-0 right-0 h-full w-72 sm:w-80 bg-gradient-to-b from-[#0a0e27] to-[#060818] border-l border-gold/20 p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="text-chakra-blue-light">
                    <AshokaChakra size={32} spinDuration={20} />
                  </div>
                  <div>
                    <div className="font-serif font-bold gold-text">INDIA</div>
                    <div className="font-deva text-xs text-white/60">भारत</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => scrollTo(item.id)}
                    className={`text-left px-4 py-3 rounded-xl font-serif tracking-wide transition-all ${
                      activeSection === item.id
                        ? "bg-gradient-to-r from-saffron/20 to-india-green/20 text-white border border-gold/30"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="text-gold/50 text-xs mr-3">
                      0{i + 1}
                    </span>
                    {item.label}
                  </motion.button>
                ))}
              </nav>

              <div className="mt-auto pt-6 border-t border-white/10">
                <p className="font-deva text-center text-white/60 text-sm">
                  जय हिन्द
                </p>
                <p className="font-serif text-center gold-text text-xs tracking-widest mt-1">
                  JAI HIND
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
