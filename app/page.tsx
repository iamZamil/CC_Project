import CompilerInterface from "@/components/compiler-interface"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Compiler Construction Project F223266 Zamil F223289 Abdullah F223276 Sana noor",
  description: "A web-based compiler for a custom programming language",
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">F223266 Zamil F223289 Abdullah F223276 Sana noor</h1>
          <p className="text-muted-foreground">A web-based compiler for a custom programming language</p>
        </div>
      </header>
      <div className="container mx-auto flex-1 py-6">
        <CompilerInterface />
      </div>
    </main>
  )
}
