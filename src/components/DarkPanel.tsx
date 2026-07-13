import { forwardRef } from "react";

export const DarkPanel = forwardRef<HTMLElement, {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}>(
  function DarkPanel({ children, icon, title }, ref) {
    return (
      <section
        className="motion-in scroll-mt-4 rounded-xl border border-white/10 bg-[#191b1f] p-4 shadow-xl shadow-black/20"
        ref={ref}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <span className="text-cyan-200">{icon}</span>
        </div>
        {children}
      </section>
    );
  },
);
