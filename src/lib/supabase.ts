import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export const SEND_MESSAGE_URL = import.meta.env.VITE_SEND_MESSAGE_URL as string;

export type LeadStatus =
  | "novo"
  | "qualificado"
  | "agendado"
  | "reuniao-feita"
  | "proposta"
  | "ganho"
  | "perdido";

export type Channel = "whatsapp" | "instagram";
export type AgentType = "sdr" | "atendimento" | "human";
export type Direction = "inbound" | "outbound";

export interface Lead {
  id: string;
  nome: string;
  whatsapp: string | null;
  instagram: string | null;
  instagram_id?: string | null;
  tipo_negocio: string | null;
  faturamento: string | null;
  maior_dor: string | null;
  score: number;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  canal: Channel;
  status: string;
  agent_type: AgentType;
  agent_state: Record<string, unknown> | null;
  unread_count: number;
  created_at: string;
  updated_at?: string;
  lead?: Lead;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  direcao: Direction;
  conteudo: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  lead_id: string;
  cal_event_id: string;
  scheduled_at: string;
  status: string;
}

export interface Sequence {
  id: string;
  lead_id: string;
  type: string;
  scheduled_at: string;
  status: "pending" | "sent" | "cancelled";
  message_template: string;
  created_at: string;
}

export const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; border: string; bg: string }
> = {
  novo: { label: "Novos", color: "#94A3B8", border: "border-t-slate-400", bg: "bg-slate-500/10" },
  qualificado: {
    label: "Qualificados",
    color: "#3B82F6",
    border: "border-t-blue-500",
    bg: "bg-blue-500/10",
  },
  agendado: {
    label: "Agendados",
    color: "#10B981",
    border: "border-t-emerald-500",
    bg: "bg-emerald-500/10",
  },
  "reuniao-feita": {
    label: "Reunião Feita",
    color: "#8B5CF6",
    border: "border-t-violet-500",
    bg: "bg-violet-500/10",
  },
  proposta: {
    label: "Proposta",
    color: "#EAB308",
    border: "border-t-yellow-500",
    bg: "bg-yellow-500/10",
  },
  ganho: {
    label: "Ganhos",
    color: "#10B981",
    border: "border-t-emerald-500",
    bg: "bg-emerald-500/10",
  },
  perdido: {
    label: "Perdidos",
    color: "#EF4444",
    border: "border-t-red-500",
    bg: "bg-red-500/10",
  },
};

export const STATUS_ORDER: LeadStatus[] = [
  "novo",
  "qualificado",
  "agendado",
  "reuniao-feita",
  "proposta",
  "ganho",
  "perdido",
];

export const AGENT_CONFIG: Record<
  AgentType,
  { label: string; short: string; emoji: string; classes: string }
> = {
  sdr: {
    label: "SDR Autônomo",
    short: "SDR",
    emoji: "🤖",
    classes: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  atendimento: {
    label: "Atendimento IA",
    short: "Atend.",
    emoji: "🤖",
    classes: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  human: {
    label: "Humano (você)",
    short: "Humano",
    emoji: "👤",
    classes: "bg-gray-500/15 text-gray-300 border-gray-500/30",
  },
};
