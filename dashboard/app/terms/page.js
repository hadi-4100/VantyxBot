"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  FileText,
  Calendar,
  AlertCircle,
  Shield,
  Users,
  Gavel,
} from "lucide-react";

export default function TermsOfService() {
  const lastUpdated = "January 27, 2026";

  return (
    <div className="min-h-screen bg-void text-white">
      <Navbar />

      <div className="pt-32 pb-20 container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary mb-6 shadow-glow">
            <FileText size={40} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gradient">
            Terms of Service
          </h1>
          <p className="text-gray-400 text-xl mb-4">
            Please read these terms carefully before using Vantyx
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm">
            <Calendar size={16} className="text-primary" />
            <span className="text-gray-400">Last Updated:</span>
            <span className="text-white font-semibold">{lastUpdated}</span>
          </div>
        </div>

        {/* Important Notice */}
        <div
          className="card mb-12 border-l-4 border-primary animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Important Notice</h3>
              <p className="text-gray-400 leading-relaxed">
                By inviting Vantyx to your Discord server or using our services,
                you agree to be bound by these Terms of Service. If you do not
                agree to these terms, please do not use our bot or services.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          <Section icon={Users} title="1. Acceptance of Terms" delay="0.2s">
            <p>
              By accessing or using Vantyx ("the Bot"), you agree to comply with
              and be bound by these Terms of Service. These terms apply to all
              users of the Bot, including server owners, administrators, and
              members.
            </p>
            <p>
              We reserve the right to update or modify these terms at any time
              without prior notice. Your continued use of the Bot after any
              changes constitutes acceptance of the new terms.
            </p>
          </Section>

          <Section icon={Shield} title="2. Description of Service" delay="0.3s">
            <p>
              Vantyx is a Discord bot that provides various features including
              but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Server moderation tools and automation</li>
              <li>Leveling and XP systems</li>
              <li>Giveaway management</li>
              <li>Welcome and farewell messages</li>
              <li>Ticket support systems</li>
              <li>Reaction roles and custom commands</li>
              <li>Invite tracking and analytics</li>
            </ul>
            <p>
              We strive to maintain the Bot's availability and functionality but
              do not guarantee uninterrupted or error-free service.
            </p>
          </Section>

          <Section icon={Gavel} title="3. User Responsibilities" delay="0.4s">
            <p>As a user of Vantyx, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Use the Bot in compliance with Discord's Terms of Service and
                Community Guidelines
              </li>
              <li>
                Not use the Bot for any illegal, harmful, or malicious purposes
              </li>
              <li>Not attempt to exploit, hack, or reverse engineer the Bot</li>
              <li>Not use the Bot to spam, harass, or abuse other users</li>
              <li>
                Not use the Bot to distribute malware, viruses, or harmful
                content
              </li>
              <li>
                Respect the intellectual property rights of Vantyx and its
                developers
              </li>
            </ul>
          </Section>

          <Section
            icon={AlertCircle}
            title="4. Prohibited Activities"
            delay="0.5s"
          >
            <p>The following activities are strictly prohibited:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Using the Bot to violate any local, state, national, or
                international law
              </li>
              <li>
                Attempting to gain unauthorized access to the Bot's systems or
                databases
              </li>
              <li>Interfering with or disrupting the Bot's services</li>
              <li>
                Creating multiple accounts to abuse or circumvent Bot features
              </li>
              <li>
                Selling, trading, or transferring Bot-related data or features
              </li>
              <li>Using automated scripts or bots to interact with Vantyx</li>
            </ul>
            <p className="text-yellow-400 font-semibold">
              Violation of these terms may result in immediate termination of
              service and potential legal action.
            </p>
          </Section>

          <Section
            icon={Shield}
            title="5. Data Collection and Privacy"
            delay="0.6s"
          >
            <p>
              Vantyx collects and stores certain data to provide its services.
              This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Server IDs, channel IDs, and role IDs</li>
              <li>User IDs and basic Discord profile information</li>
              <li>Message content for moderation and command processing</li>
              <li>Server configuration and settings</li>
              <li>Usage statistics and analytics</li>
            </ul>
            <p>
              For detailed information about how we collect, use, and protect
              your data, please refer to our{" "}
              <a
                href="/privacy"
                className="text-primary hover:text-blue-glow underline transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>
          </Section>

          <Section
            icon={FileText}
            title="6. Intellectual Property"
            delay="0.7s"
          >
            <p>
              All content, features, and functionality of Vantyx, including but
              not limited to text, graphics, logos, icons, images, and software,
              are the exclusive property of Vantyx and its developers.
            </p>
            <p>
              You may not copy, modify, distribute, sell, or lease any part of
              our services without explicit written permission.
            </p>
          </Section>

          <Section
            icon={AlertCircle}
            title="7. Disclaimer of Warranties"
            delay="0.8s"
          >
            <p>
              Vantyx is provided "as is" and "as available" without warranties
              of any kind, either express or implied. We do not warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The Bot will be available at all times</li>
              <li>The Bot will be error-free or secure</li>
              <li>The results obtained from using the Bot will be accurate</li>
              <li>Any errors in the Bot will be corrected</li>
            </ul>
          </Section>

          <Section icon={Gavel} title="8. Limitation of Liability" delay="0.9s">
            <p>
              To the maximum extent permitted by law, Vantyx and its developers
              shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages resulting from:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your use or inability to use the Bot</li>
              <li>Any unauthorized access to or use of our servers</li>
              <li>Any interruption or cessation of the Bot's services</li>
              <li>
                Any bugs, viruses, or harmful code transmitted through the Bot
              </li>
              <li>Any errors or omissions in content or data</li>
            </ul>
          </Section>

          <Section icon={Shield} title="9. Termination" delay="1s">
            <p>
              We reserve the right to terminate or suspend access to Vantyx
              immediately, without prior notice or liability, for any reason,
              including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violation of these Terms of Service</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>At our sole discretion for any other reason</li>
            </ul>
            <p>
              Upon termination, your right to use the Bot will immediately
              cease.
            </p>
          </Section>

          <Section icon={FileText} title="10. Changes to Terms" delay="1.1s">
            <p>
              We reserve the right to modify these Terms of Service at any time.
              We will notify users of any material changes by updating the "Last
              Updated" date at the top of this page.
            </p>
            <p>
              Your continued use of Vantyx after any changes constitutes
              acceptance of the new terms.
            </p>
          </Section>

          <Section icon={Users} title="11. Contact Information" delay="1.2s">
            <p>
              If you have any questions about these Terms of Service, please
              contact us:
            </p>
            <div className="mt-4 p-4 rounded-xl glass border border-white/10">
              <p className="text-gray-400">
                <span className="text-white font-semibold">
                  Support Server:
                </span>{" "}
                <a
                  href="https://discord.gg/4EbSFSJZqH"
                  className="text-primary hover:text-blue-glow underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join our Discord
                </a>
              </p>
              <p className="text-gray-400 mt-2">
                <span className="text-white font-semibold">GitHub:</span>{" "}
                <a
                  href="https://github.com/Hadi-4100"
                  className="text-primary hover:text-blue-glow underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hadi-4100
                </a>
              </p>
            </div>
          </Section>
        </div>

        {/* Footer Notice */}
        <div
          className="mt-16 p-6 rounded-2xl glass border border-white/10 text-center animate-fade-in-up"
          style={{ animationDelay: "1.3s" }}
        >
          <p className="text-gray-400">
            By using Vantyx, you acknowledge that you have read, understood, and
            agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Section Component
function Section({ icon: Icon, title, children, delay }) {
  return (
    <div
      className="card-hover animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon size={24} />
        </div>
        <h2 className="text-2xl font-bold text-white flex-1">{title}</h2>
      </div>
      <div className="ml-16 space-y-4 text-gray-400 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
