"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeSignIn } from "@/lib/memoriq-auth";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    completeSignIn()
      .then((user) => {
        if (!user) { router.replace("/memorabilia"); return; }
        setStatus("success");
        setTimeout(() => router.replace("/memorabilia"), 1500);
      })
      .catch((e: Error) => {
        setError(e.message);
        setStatus("error");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        {status === "checking" && (
          <>
            <div className="text-5xl animate-pulse">🔐</div>
            <h1 className="text-xl font-black">Signing you in…</h1>
            <p className="text-white/40 text-sm">Just a moment</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-5xl">✅</div>
            <h1 className="text-xl font-black">You're in!</h1>
            <p className="text-white/40 text-sm">Taking you back to MEMORIQ…</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl">❌</div>
            <h1 className="text-xl font-black">Sign-in failed</h1>
            <p className="text-white/40 text-sm">{error}</p>
            <button onClick={() => router.replace("/memorabilia")} className="text-yellow-400 underline text-sm">
              Back to MEMORIQ
            </button>
          </>
        )}
      </div>
    </div>
  );
}
