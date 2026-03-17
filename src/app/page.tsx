"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState("Booting Intelli-Credit workspace...");

  useEffect(() => {
    async function bootstrap() {
      try {
        const activeCase = await api.getDefaultCase();
        setStatus("Opening active case...");
        router.replace(`/case/${activeCase.id}/onboarding`);
      } catch {
        setStatus("Backend unreachable. Start FastAPI on port 8000.");
      }
    }

    void bootstrap();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fdfbf7] p-6 text-center">
      <div className="max-w-xl border-[3px] border-[#2d2d2d] bg-white p-8 shadow-[8px_8px_0px_0px_#2d2d2d]" style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}>
        <h1 className="text-4xl font-bold">Intelli-Credit</h1>
        <p className="mt-3 text-lg">{status}</p>
      </div>
    </main>
  );
}
