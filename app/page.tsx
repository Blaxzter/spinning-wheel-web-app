import { SpinningWheel } from "@/components/spinning-wheel"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <SpinningWheel />
      <Toaster />
    </main>
  )
}
