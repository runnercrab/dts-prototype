import { DM_Sans, Space_Mono } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export default function DtsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.variable} ${spaceMono.variable} font-[family-name:var(--font-dm-sans)] min-h-screen bg-[#f7f9fb]`}>
      {children}
    </div>
  );
}