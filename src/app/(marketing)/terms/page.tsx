import { Navbar } from "@/components/darko/layout/Navbar";
import { Footer } from "@/components/darko/layout/Footer";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-8">Terms of Service</h1>
          <div className="space-y-6 text-secondary leading-relaxed">
            <p className="text-sm text-muted">Last updated: {new Date().getFullYear()}</p>

            <h2 className="font-display text-xl font-bold text-white pt-4">1. Acceptance</h2>
            <p>By using DARKO, you agree to these terms. If you don&apos;t agree, don&apos;t use the service.</p>

            <h2 className="font-display text-xl font-bold text-white pt-4">2. Acceptable use</h2>
            <p>You agree NOT to:</p>
            <ul className="space-y-2 ml-4 list-disc">
              <li>Share copyrighted content without the right to do so (we do not bypass DRM)</li>
              <li>Use DARKO to harass, threaten, or harm others</li>
              <li>Share illegal content, including content that exploits minors</li>
              <li>Attempt to disrupt, overload, or attack the service</li>
              <li>Scrape, proxy, or redistribute content from the platform</li>
              <li>Impersonate other users or DARKO staff</li>
            </ul>

            <h2 className="font-display text-xl font-bold text-white pt-4">3. Content responsibility</h2>
            <p>
              You are solely responsible for the content you share, including screen-shared content, uploaded files, chat messages, and links. DARKO does not moderate content proactively — we rely on user reports and act on them according to our Safety policy.
            </p>

            <h2 className="font-display text-xl font-bold text-white pt-4">4. No DRM bypass</h2>
            <p>
              DARKO does not bypass, circumvent, or modify any digital rights management (DRM) protection. For DRM-protected streaming services (Netflix, Prime Video, Disney+, HBO, etc.), you must use the screen-share workflow, and each participant is responsible for having their own subscription. DARKO never proxies or redistributes protected streams.
            </p>

            <h2 className="font-display text-xl font-bold text-white pt-4">5. P2P file transfers</h2>
            <p>
              File transfers happen directly between participants using WebRTC DataChannels. Files do not pass through DARKO&apos;s servers and are not stored. You are responsible for verifying the safety of files you receive.
            </p>

            <h2 className="font-display text-xl font-bold text-white pt-4">6. Free-tier service</h2>
            <p>
              DARKO operates on free-tier infrastructure. We do not guarantee unlimited availability, performance, or capacity. The service may pause, sleep, or rate-limit under free-tier constraints. We may introduce paid plans in the future, but the core MVP will remain free.
            </p>

            <h2 className="font-display text-xl font-bold text-white pt-4">7. Termination</h2>
            <p>
              We may suspend or terminate access for violations of these terms. You may stop using DARKO at any time — simply close the tab. Room owners can delete their rooms at any time.
            </p>

            <h2 className="font-display text-xl font-bold text-white pt-4">8. Disclaimer</h2>
            <p>
              DARKO is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted service, data retention, or specific performance levels.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
