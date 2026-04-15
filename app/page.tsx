import { ClientOnlyApp } from "./[...slug]/client";

export const dynamic = "force-dynamic";

export default function Page() {
  return <ClientOnlyApp />;
}
