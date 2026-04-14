import { ClientOnlyApp } from "./client";

export const dynamic = "force-dynamic";

export default function Page() {
  return <ClientOnlyApp />;
}
