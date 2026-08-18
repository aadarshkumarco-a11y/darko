import { Navbar } from "@/components/darko/layout/Navbar";
import { Footer } from "@/components/darko/layout/Footer";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-8">Privacy Policy</h1>
          <div className="space-y-6 text-secondary leading-relaxed">
            <p className="text-sm text-muted">Last updated: {new Date().getFullYear()}</p>

            <h2 className="font-display text-xl font-bold text-white pt-4">1. Minimum data collection</h2>
            <p>
              DARKO is guest-first. You can create and join rooms without an account. We do not require your email, phone number, or any personal information to use the core product.
            </p>

            <h2 className="font-display text-xl font-bold text-white pt-4">2. What we collect</h2>
            <ul className="space-y-2 ml-4 list-disc">
              <li><strong className="text-white">Guest sessions:</strong> A display name (you choose) and a random session ID. No email, no DB row. Session expires in 24 hours.</li>
              <li><strong className="text-white">Google OAuth users:</strong> Your name, email, and profile picture — only if you explicitly choose &quot;Continue with Google.&quot; Used to persist your rooms and preferences across devices.</li>
              <li><strong className="text-white">Room metadata:</strong> Room title, theme, settings, and chat messages you send. Persisted only for room functionality.</li>
              <li><strong className="text-white">Usage analytics:</strong> We do not run third-party analytics. No Google Analytics, no Mixpanel, no tracking pixels.</li>
            </ul>

            <h2 className="font-display text-xl font-bold text-white pt-4">3. Voice, video, and files</h2>
            <p>
              Voice, video, screen share, and file transfers use direct peer-to-peer WebRTC connections. <strong className="text-white">Your media and files never touch our servers.</strong> We do not record voice or video. We do not store your files.
            </p>

            <h2 className="font-display text-xl font-bold text-white pt-4">4. Realtime signaling</h2>
            <p>
              WebRTC signaling (the connection setup) is relayed through our Socket.IO server. Signaling events are transient — they are not persisted to the database. Once a peer connection is established, media flows directly between participants.
            </p>

            <h2 className="font-display text-xl font-bold text-white pt-4">5. Cookies</h2>
            <p>
              We use HTTP-only cookies for session management. No tracking cookies, no third-party advertising cookies.
            </p>

            <h2 className="font-display text-xl font-bold text-white pt-4">6. Data deletion</h2>
            <p>
              Room owners can delete their rooms at any time — this cascades to all messages, playlists, and members. Google OAuth users can request full account deletion by contacting us.
            </p>

            <h2 className="font-display text-xl font-bold text-white pt-4">7. Children&apos;s privacy</h2>
            <p>
              DARKO is not directed at children under 13. We do not knowingly collect data from children. If you believe a child has provided us data, contact us for deletion.
            </p>

            <h2 className="font-display text-xl font-bold text-white pt-4">8. Contact</h2>
            <p>
              For privacy questions or data deletion requests, open an issue on our GitHub repository.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
