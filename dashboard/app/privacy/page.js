"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield,
  Calendar,
  Lock,
  Database,
  Eye,
  UserX,
  AlertTriangle,
  Mail,
  Cookie,
  FileText,
} from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "January 27, 2026";

  return (
    <div className="min-h-screen bg-void text-white">
      <Navbar />

      <div className="pt-32 pb-20 container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-6 shadow-glow-green">
            <Shield size={40} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gradient">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-xl mb-4">
            Your privacy is important to us. Learn how we protect your data.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm">
            <Calendar size={16} className="text-emerald-400" />
            <span className="text-gray-400">Last Updated:</span>
            <span className="text-white font-semibold">{lastUpdated}</span>
          </div>
        </div>

        {/* Important Notice */}
        <div
          className="card mb-12 border-l-4 border-emerald-500 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Your Privacy Matters</h3>
              <p className="text-gray-400 leading-relaxed">
                This Privacy Policy explains how Vantyx collects, uses, stores,
                and protects your information when you use our Discord bot and
                related services. We are committed to protecting your privacy
                and ensuring transparency in our data practices.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          <Section
            icon={FileText}
            title="1. Information We Collect"
            delay="0.2s"
            color="blue"
          >
            <p>
              Vantyx collects and processes the following types of information
              to provide and improve our services:
            </p>

            <div className="mt-4 space-y-4">
              <SubSection title="Discord User Information">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>User ID (unique Discord identifier)</li>
                  <li>Username and discriminator</li>
                  <li>Avatar URL</li>
                  <li>Server (guild) membership information</li>
                  <li>Roles assigned to you in servers</li>
                </ul>
              </SubSection>

              <SubSection title="Server (Guild) Information">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Server ID and name</li>
                  <li>Server icon and settings</li>
                  <li>Channel IDs and names</li>
                  <li>Role IDs, names, and permissions</li>
                  <li>Server member count</li>
                </ul>
              </SubSection>

              <SubSection title="Usage Data">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Commands executed and their parameters</li>
                  <li>Feature usage statistics</li>
                  <li>XP and leveling progress</li>
                  <li>Invite tracking data</li>
                  <li>Moderation actions and logs</li>
                  <li>Giveaway participation and winners</li>
                  <li>Ticket system interactions</li>
                </ul>
              </SubSection>

              <SubSection title="Message Content">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Messages containing bot commands (for command processing)
                  </li>
                  <li>
                    Messages in moderation logs (when moderation features are
                    enabled)
                  </li>
                  <li>
                    Custom welcome/farewell messages configured by server admins
                  </li>
                </ul>
                <p className="text-yellow-400 text-sm mt-2">
                  Note: We do not store general message content unless
                  specifically required for enabled features.
                </p>
              </SubSection>
            </div>
          </Section>

          <Section
            icon={Database}
            title="2. How We Use Your Information"
            delay="0.3s"
            color="purple"
          >
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Service Delivery:</strong> To provide and maintain the
                Bot's features and functionality
              </li>
              <li>
                <strong>Personalization:</strong> To customize your experience
                based on server settings and preferences
              </li>
              <li>
                <strong>Analytics:</strong> To understand how users interact
                with the Bot and improve our services
              </li>
              <li>
                <strong>Moderation:</strong> To enforce server rules and
                maintain a safe community environment
              </li>
              <li>
                <strong>Support:</strong> To respond to user inquiries and
                provide technical assistance
              </li>
              <li>
                <strong>Security:</strong> To detect and prevent abuse, fraud,
                or violations of our Terms of Service
              </li>
              <li>
                <strong>Compliance:</strong> To comply with legal obligations
                and Discord's Terms of Service
              </li>
            </ul>
          </Section>

          <Section
            icon={Lock}
            title="3. Data Storage and Security"
            delay="0.4s"
            color="emerald"
          >
            <p>
              We take the security of your data seriously and implement
              appropriate measures to protect it:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Data is stored in secure MongoDB databases with encryption at
                rest
              </li>
              <li>Access to data is restricted to authorized personnel only</li>
              <li>
                We use industry-standard security protocols and best practices
              </li>
              <li>Regular security audits and updates are performed</li>
              <li>
                Data transmission is encrypted using secure protocols
                (HTTPS/TLS)
              </li>
            </ul>
            <p className="text-yellow-400 mt-4">
              However, no method of transmission over the internet or electronic
              storage is 100% secure. While we strive to protect your data, we
              cannot guarantee absolute security.
            </p>
          </Section>

          <Section
            icon={Eye}
            title="4. Data Sharing and Disclosure"
            delay="0.5s"
            color="blue"
          >
            <p>
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information only in the following
              circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>With Discord:</strong> As required by Discord's API
                Terms of Service
              </li>
              <li>
                <strong>Server Administrators:</strong> Server-specific data is
                accessible to server owners and administrators through the
                dashboard
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, court
                order, or government regulation
              </li>
              <li>
                <strong>Service Protection:</strong> To protect the rights,
                property, or safety of Vantyx, our users, or the public
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger,
                acquisition, or sale of assets (with prior notice)
              </li>
            </ul>
          </Section>

          <Section
            icon={Cookie}
            title="5. Cookies and Tracking"
            delay="0.6s"
            color="amber"
          >
            <p>
              Our dashboard website uses cookies and similar technologies to
              enhance your experience:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Authentication Cookies:</strong> To keep you logged in
                and maintain your session
              </li>
              <li>
                <strong>Preference Cookies:</strong> To remember your settings
                and preferences
              </li>
              <li>
                <strong>Analytics Cookies:</strong> To understand how users
                interact with our website
              </li>
            </ul>
            <p className="mt-4">
              You can control cookies through your browser settings. However,
              disabling cookies may affect the functionality of our dashboard.
            </p>
          </Section>

          <Section
            icon={UserX}
            title="6. Data Retention"
            delay="0.7s"
            color="red"
          >
            <p>We retain your data for as long as necessary to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide our services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce our agreements</li>
            </ul>
            <p className="mt-4">
              When you remove Vantyx from your server, most server-specific data
              is automatically deleted within 30 days. However, some data may be
              retained for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Legal compliance and record-keeping</li>
              <li>Fraud prevention and security purposes</li>
              <li>Aggregated analytics (anonymized)</li>
            </ul>
          </Section>

          <Section
            icon={Shield}
            title="7. Your Rights and Choices"
            delay="0.8s"
            color="emerald"
          >
            <p>You have the following rights regarding your data:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Access:</strong> Request a copy of the data we have
                about you
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate or
                incomplete data
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your data
                (subject to legal requirements)
              </li>
              <li>
                <strong>Portability:</strong> Request your data in a
                machine-readable format
              </li>
              <li>
                <strong>Objection:</strong> Object to certain data processing
                activities
              </li>
              <li>
                <strong>Opt-Out:</strong> Opt out of certain features or data
                collection
              </li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us through our support
              server or via the contact information provided below.
            </p>
          </Section>

          <Section
            icon={AlertTriangle}
            title="8. Third-Party Services"
            delay="0.9s"
            color="yellow"
          >
            <p>
              Vantyx integrates with Discord and may interact with other
              third-party services. Please note:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                We are not responsible for the privacy practices of Discord or
                other third-party services
              </li>
              <li>
                Your use of Discord is governed by{" "}
                <a
                  href="https://discord.com/privacy"
                  className="text-primary hover:text-blue-glow underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord's Privacy Policy
                </a>
              </li>
              <li>
                We recommend reviewing the privacy policies of any third-party
                services you use
              </li>
            </ul>
          </Section>

          <Section
            icon={FileText}
            title="9. Children's Privacy"
            delay="1s"
            color="blue"
          >
            <p>
              Vantyx is intended for use by individuals who meet Discord's
              minimum age requirements (13 years old, or older in some
              jurisdictions). We do not knowingly collect personal information
              from children under the age required by Discord.
            </p>
            <p>
              If we become aware that we have collected data from a child under
              the required age without parental consent, we will take steps to
              delete that information as quickly as possible.
            </p>
          </Section>

          <Section
            icon={FileText}
            title="10. Changes to This Privacy Policy"
            delay="1.1s"
            color="purple"
          >
            <p>
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technology, legal requirements, or other
              factors. When we make changes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                We will update the "Last Updated" date at the top of this page
              </li>
              <li>
                Material changes will be announced in our support server or
                through the dashboard
              </li>
              <li>
                Your continued use of Vantyx after changes constitutes
                acceptance of the updated policy
              </li>
            </ul>
            <p className="mt-4">
              We encourage you to review this Privacy Policy periodically to
              stay informed about how we protect your data.
            </p>
          </Section>

          <Section
            icon={Mail}
            title="11. Contact Us"
            delay="1.2s"
            color="emerald"
          >
            <p>
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-4 p-6 rounded-xl glass border border-emerald-500/20">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-emerald-400 mt-1" />
                  <div>
                    <p className="text-white font-semibold mb-1">
                      Support Server
                    </p>
                    <a
                      href="https://discord.gg/4EbSFSJZqH"
                      className="text-primary hover:text-blue-glow underline transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join our Discord Community
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText size={20} className="text-emerald-400 mt-1" />
                  <div>
                    <p className="text-white font-semibold mb-1">GitHub</p>
                    <a
                      href="https://github.com/Hadi-4100"
                      className="text-primary hover:text-blue-glow underline transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Hadi-4100
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              We will respond to your inquiries as soon as possible, typically
              within 48 hours.
            </p>
          </Section>
        </div>

        {/* Footer Notice */}
        <div
          className="mt-16 p-6 rounded-2xl glass border border-emerald-500/20 text-center animate-fade-in-up"
          style={{ animationDelay: "1.3s" }}
        >
          <Shield size={32} className="mx-auto text-emerald-400 mb-3" />
          <p className="text-gray-400 mb-2">
            By using Vantyx, you acknowledge that you have read and understood
            this Privacy Policy and agree to our data practices as described
            herein.
          </p>
          <p className="text-sm text-gray-500">
            For more information about your rights and our services, please
            refer to our{" "}
            <a
              href="/terms"
              className="text-primary hover:text-blue-glow underline transition-colors"
            >
              Terms of Service
            </a>
            .
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Section Component
function Section({ icon: Icon, title, children, delay, color = "blue" }) {
  const colorClasses = {
    blue: "bg-primary/10 text-primary",
    purple: "bg-purple-500/10 text-purple-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    red: "bg-red-500/10 text-red-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
  };

  return (
    <div
      className="card-hover animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClasses[color]}`}
        >
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

// SubSection Component
function SubSection({ title, children }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <h4 className="text-white font-semibold mb-2">{title}</h4>
      <div className="text-gray-400">{children}</div>
    </div>
  );
}
