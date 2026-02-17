"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Zap,
  Shield,
  TrendingUp,
  Users,
  ArrowRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/utils/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [status, setStatus] = useState(code ? "authenticating" : "redirecting");
  const [error, setError] = useState("");
  const hasExchanged = useRef(false);

  useEffect(() => {
    if (code && !hasExchanged.current) {
      // Mark as exchanged to prevent duplicate requests
      hasExchanged.current = true;

      // Exchange code for token
      api
        .post("/auth/token", { code }, {}, { showConsoleError: false })
        .then((data) => {
          if (data && data._isError) {
            setStatus("error");
            setError(data.message || "Failed to reach API");
            return;
          }
          if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            setStatus("success");
            setTimeout(() => router.push("/servers"), 1000);
          } else {
            setStatus("error");
            setError(data.error || "Failed to authenticate");
          }
        })
        .catch((err) => {
          setStatus("error");
          setError(err.message || "Authentication failed");
        });
    } else if (!code) {
      // Fetch Client ID and Redirect
      api
        .get("/auth/config", {}, { showConsoleError: false })
        .then((data) => {
          if (data && data._isError) {
            setStatus("error");
            setError(data.message || "Failed to reach API");
            return;
          }
          const redirectUri = encodeURIComponent(data.redirectUri);
          window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${data.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds`;
        })
        .catch((err) => {
          setStatus("error");
          setError("Failed to initialize authentication");
        });
    }
  }, [code, router]);

  return (
    <div className="min-h-screen bg-void text-white flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute top-40 right-10 w-[500px] h-[500px] bg-blue-glow/15 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

      <div className="relative z-10 max-w-md w-full mx-4">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-block relative mb-4">
            <div className="absolute inset-0 bg-gradient-blue-glow rounded-2xl blur-xl opacity-50"></div>
            <div className="relative w-20 h-20 bg-gradient-blue-glow rounded-2xl flex items-center justify-center shadow-glow-lg">
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
          <h1 className="text-4xl font-bold mb-2 text-gradient">Vantyx</h1>
          <p className="text-gray-400">Dashboard Login</p>
        </div>

        {/* Status Card */}
        <div
          className="card-hover text-center animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          {status === "loading" && (
            <>
              <Loader2
                size={48}
                className="text-primary mx-auto mb-4 animate-spin"
              />
              <h2 className="text-2xl font-bold mb-2">Initializing...</h2>
              <p className="text-gray-400">Setting up authentication</p>
            </>
          )}

          {status === "redirecting" && (
            <>
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">
                Redirecting to Discord
              </h2>
              <p className="text-gray-400">Please wait...</p>
            </>
          )}

          {status === "authenticating" && (
            <>
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">Authenticating</h2>
              <p className="text-gray-400">Verifying your Discord account...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-emerald-400">
                Success!
              </h2>
              <p className="text-gray-400">Redirecting to dashboard...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-red-400">
                Authentication Failed
              </h2>
              <p className="text-gray-400 mb-6">
                {error || "Something went wrong"}
              </p>
              <div className="grid grid-rows-2 gap-4 w-52 mx-auto">
                <button
                  onClick={() => (window.location.href = "/login")}
                  className="btn-primary inline-flex justify-center gap-2"
                >
                  Try Again
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="btn-secondary inline-flex justify-center gap-2"
                >
                  Return Home
                  <ArrowLeft size={18} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Features */}
        <div
          className="mt-8 grid grid-cols-2 gap-4 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          {[
            { icon: Shield, label: "Secure" },
            { icon: TrendingUp, label: "Analytics" },
            { icon: Users, label: "Management" },
            { icon: Zap, label: "Fast" },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass rounded-xl p-4 text-center group hover:border-primary/30 transition-all"
            >
              <feature.icon
                size={24}
                className="text-primary mx-auto mb-2 group-hover:scale-110 transition-transform"
              />
              <p className="text-sm text-gray-400 font-medium">
                {feature.label}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="mt-8 text-center text-sm text-gray-500 animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <p>By logging in, you agree to our Terms of Service</p>
          <p className="mt-2">Powered by Discord OAuth2</p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-void text-white flex items-center justify-center">
          <Loader2 size={48} className="text-primary animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
