import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Tycho" };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl" aria-hidden>
            🌑
          </p>
          <h1 className="mt-3 text-xl font-semibold">Sign in to Tycho</h1>
        </div>
        <div className="card p-6">
          <SignInForm next={next} />
        </div>
      </div>
    </main>
  );
}
