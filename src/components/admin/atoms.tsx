import { cn } from "@/lib/utils";
import { STATUS_CONFIG, type Channel, type LeadStatus } from "@/lib/supabase";
import { Instagram, MessageCircle } from "lucide-react";

export function ScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const color =
    score >= 9
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : score >= 7
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : score >= 5
          ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
          : "bg-gray-500/15 text-gray-300 border-gray-500/30";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-semibold tabular-nums",
        size === "lg" ? "px-2.5 py-1 text-sm" : "px-1.5 py-0.5 text-[11px]",
        color,
      )}
    >
      {score}/10
    </span>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
      style={{
        color: cfg.color,
        borderColor: `${cfg.color}55`,
        background: `${cfg.color}15`,
      }}
    >
      {cfg.label}
    </span>
  );
}

export function ChannelIcon({ channel, size = 14 }: { channel: Channel; size?: number }) {
  return channel === "whatsapp" ? (
    <MessageCircle size={size} className="text-emerald-400" />
  ) : (
    <Instagram size={size} className="text-pink-400" />
  );
}

export function TimeAgo({ date }: { date: string | Date }) {
  return <span className="text-xs text-gray-400">{timeAgo(date)}</span>;
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "ontem";
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: "linear-gradient(135deg,#1B4332,#40916C)",
      }}
    >
      {initials(name || "?")}
    </div>
  );
}
