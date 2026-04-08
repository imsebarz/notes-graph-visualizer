"use client";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#06060f] flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Animated orbs */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-indigo-500/30 animate-ping animation-delay-200" />
          <div className="absolute inset-4 rounded-full bg-indigo-500/50 animate-pulse" />
          <div className="absolute inset-6 rounded-full bg-indigo-500 animate-pulse" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-white/60 text-sm font-medium">
            Building knowledge graph...
          </p>
          <p className="text-white/25 text-xs">
            Mapping connections between your notes
          </p>
        </div>
      </div>
    </div>
  );
}
