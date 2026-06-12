import { createFileRoute } from "@tanstack/react-router";
import { AdminLayoutRoute } from "@/components/admin/Layout";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayoutRoute,
});
