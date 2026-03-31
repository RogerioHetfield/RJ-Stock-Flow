import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div className="absolute inset-0">
        <div className="absolute top-[-80px] left-[-80px] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-100px] right-[-100px] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/5 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <img
              src="/logo.png"
              alt="RJ Gás & Água"
              className="mb-4 h-59 w-auto object-contain drop-shadow-md"
            />

            <h1 className="text-4xl font-bold tracking-tight text-white">
              RJ Stock Flow
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              Controle de estoque, vendas e operação da loja
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}