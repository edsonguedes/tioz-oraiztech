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
  | "reuniao"
  | "cliente"
  | "perdido";
export type Channel = "whatsapp" | "instagram";

export interface Lead {
  id: string;
  nome: string;
  whatsapp: string;
  tipo_negocio: string;
  faturamento: string;
  maior_dor: string;
  score: number;
  status: LeadStatus;
  instagram_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  channel: Channel;
  status: string;
  created_at: string;
  lead?: Lead;
  messages?: Message[];
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  body: string;
  channel: Channel;
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
  novo: { label: "Novos", color: "#9CA3AF", border: "border-t-gray-400", bg: "bg-gray-500/10" },
  qualificado: {
    label: "Qualificados",
    color: "#3B82F6",
    border: "border-t-blue-500",
    bg: "bg-blue-500/10",
  },
  agendado: {
    label: "Agendados",
    color: "#F59E0B",
    border: "border-t-amber-500",
    bg: "bg-amber-500/10",
  },
  reuniao: {
    label: "Em Reunião",
    color: "#8B5CF6",
    border: "border-t-violet-500",
    bg: "bg-violet-500/10",
  },
  cliente: {
    label: "Clientes",
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
  "reuniao",
  "cliente",
  "perdido",
];
