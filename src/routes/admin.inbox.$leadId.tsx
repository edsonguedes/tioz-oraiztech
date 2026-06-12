import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/inbox/$leadId")({
  component: () => null,
});
