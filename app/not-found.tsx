import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,22,63,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full border border-red-950/60 bg-zinc-950/80 backdrop-blur-md p-8 shadow-[0_0_30px_rgba(216,22,63,0.2)]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-red-900/40 pb-3 mb-6">
          <span className="font-mono text-xs text-red-500 tracking-widest uppercase">
            [SYS_ERR: 404 // SIGNAL_LOST]
          </span>
          <div className="flex space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
          </div>
        </div>

        {/* 404 Code */}
        <h1 className="text-7xl md:text-8xl font-black text-white tracking-wider mb-2 font-avathe drop-shadow-[0_0_15px_rgba(216,22,63,0.6)]">
          404
        </h1>

        <p className="font-mono text-sm text-zinc-400 mb-6 uppercase tracking-wider">
          TRANSMISSION FREQUENCY OUT OF RANGE OR UNASSIGNED
        </p>

        {/* Navigation Action */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center font-mono text-xs">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-[#D8163F] hover:bg-[#b01032] text-white font-bold tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(216,22,63,0.5)] active:scale-95 uppercase"
          >
            &lt; RETURN TO CONSOLE
          </Link>
          <Link
            href="/mixes"
            className="w-full sm:w-auto px-6 py-3 border border-zinc-700 hover:border-red-500/70 hover:text-red-400 text-zinc-300 transition-all duration-200 uppercase"
          >
            BROWSE ARCHIVE &gt;
          </Link>
        </div>
      </div>
    </main>
  );
}
