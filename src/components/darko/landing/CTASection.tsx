"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/shared/Button";

export function CTASection() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-border-strong p-8 sm:p-16 text-center"
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.25), transparent 60%), linear-gradient(180deg, #11131F 0%, #0A0B14 100%)",
            }}
          />
          <div className="absolute inset-0 bg-dots opacity-30" />

          <div className="relative">
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Your friends are
              <br />
              <span className="text-gradient-accent">one link away.</span>
            </h2>
            <p className="mt-6 text-base sm:text-lg text-secondary max-w-xl mx-auto leading-relaxed">
              Spin up a room in seconds. Share the link. Watch, talk, play, share — together, in real time. No installs, no sign-ups, no friction.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="glow" size="xl" asChild rightIcon={<ArrowRight className="h-5 w-5" />}>
                <Link href="/rooms/create">Create a room — it&apos;s free</Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link href="/features">Learn more</Link>
              </Button>
            </div>
            <p className="mt-8 text-xs text-muted">
              ₹0 forever · No credit card · No app install · Browser-native
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
