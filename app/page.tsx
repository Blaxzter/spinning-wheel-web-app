import { SpinningWheel } from "@/components/spinning-wheel";
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Suspense fallback={<div>Loading...</div>}>
        <SpinningWheel />
      </Suspense>
      <Toaster />
    </main>
  );
}
