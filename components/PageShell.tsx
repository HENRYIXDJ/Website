'use client';

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 selection:bg-primary/30 selection:text-primary">
      <main className="w-full flex flex-col justify-center">{children}</main>
    </div>
  );
}
