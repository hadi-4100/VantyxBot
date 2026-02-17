import Link from "next/link";
import {
  X,
  GithubIcon,
  MessageCircle,
  Shield,
  FileText,
  Heart,
} from "lucide-react";
import config from "@config";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-abyss border-t border-white/5 pt-16 pb-8 overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-glow/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-blue-glow rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-gradient-blue-glow rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-glow">
                  <Image
                    src="/logo.png"
                    alt="Vantyx Logo"
                    className="w-full h-full object-contain"
                    width={64}
                    height={64}
                    unoptimized
                  />
                </div>
              </div>
              <span className="text-2xl font-bold text-gradient">Vantyx</span>
            </div>
            <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
              The ultimate Discord bot for moderation, leveling, giveaways, and
              more. Elevate your community with next-generation features and a
              beautiful dashboard.
            </p>
            <div className="flex gap-3">
              <SocialLink href={config.LINKS.X} icon={X} label="Twitter" />
              <SocialLink
                href={config.LINKS.GITHUB}
                icon={GithubIcon}
                label="GitHub"
              />
              <SocialLink
                href={config.LINKS.SUPPORT}
                icon={MessageCircle}
                label="Discord"
              />
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-white">Product</h3>
            <ul className="space-y-4">
              <FooterLink href="/commands">Commands</FooterLink>
              <FooterLink href="/stats">Statistics</FooterLink>
              <FooterLink href={config.LINKS.SUPPORT}>
                Support Server
              </FooterLink>
              <FooterLink href="/servers">Dashboard</FooterLink>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-white">Legal</h3>
            <ul className="space-y-4">
              <FooterLink href={config.LINKS.TERMS} icon={FileText}>
                Terms of Service
              </FooterLink>
              <FooterLink href={config.LINKS.PRIVACY} icon={Shield}>
                Privacy Policy
              </FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            © {currentYear} Vantyx. All rights reserved. Not affiliated with
            Discord Inc.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Made with</span>
            <Heart
              size={14}
              className="text-red-500 animate-pulse"
              fill="currentColor"
            />
            <span>by the Vantyx Team</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-emerald-500/20 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-medium">
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Social Link Component
function SocialLink({ href, icon: Icon, label }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="w-10 h-10 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary/20 hover:border-primary/30 hover:shadow-glow transition-all group"
    >
      <Icon size={20} className="group-hover:scale-110 transition-transform" />
    </Link>
  );
}

// Footer Link Component
function FooterLink({ href, icon: Icon, children }) {
  return (
    <li>
      <Link
        href={href}
        className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group"
      >
        {Icon && (
          <Icon
            size={16}
            className="group-hover:scale-110 transition-transform"
          />
        )}
        <span>{children}</span>
      </Link>
    </li>
  );
}
