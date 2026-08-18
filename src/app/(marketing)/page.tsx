import { Navbar } from "@/components/darko/layout/Navbar";
import { Footer } from "@/components/darko/layout/Footer";
import { Hero } from "@/components/darko/landing/Hero";
import { HowItWorks } from "@/components/darko/landing/HowItWorks";
import { FeatureSection } from "@/components/darko/landing/FeatureSection";
import { CTASection } from "@/components/darko/landing/CTASection";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main className="relative">
        <Hero />
        <HowItWorks />
        <FeatureSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
