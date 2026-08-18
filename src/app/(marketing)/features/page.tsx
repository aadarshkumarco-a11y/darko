import { Navbar } from "@/components/darko/layout/Navbar";
import { Footer } from "@/components/darko/layout/Footer";
import { FeatureSection } from "@/components/darko/landing/FeatureSection";
import { CTASection } from "@/components/darko/landing/CTASection";

export const metadata = { title: "Features" };

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center mb-12">
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-white">
            Everything in <span className="text-gradient-accent">one room.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-secondary max-w-2xl mx-auto">
            Stop juggling Discord, Twitch, Google Drive, and three browser tabs. DARKO puts everything your group needs inside a single shared space.
          </p>
        </div>
        <FeatureSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
