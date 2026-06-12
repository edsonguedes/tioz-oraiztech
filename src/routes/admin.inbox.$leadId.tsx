import { createFileRoute } from "@tanstack/react-router";
import { Route as InboxRoute } from "./admin.inbox";

export const Route = createFileRoute("/admin/inbox/$leadId")({
  component: InboxRoute.options.component!,
});
