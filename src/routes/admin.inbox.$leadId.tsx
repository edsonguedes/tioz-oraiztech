import { createFileRoute } from "@tanstack/react-router";
import { InboxPage } from "./admin.inbox";

export const Route = createFileRoute("/admin/inbox/$leadId")({
  component: InboxPage,
});
