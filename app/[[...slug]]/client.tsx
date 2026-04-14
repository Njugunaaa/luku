"use client";

import dynamic from "next/dynamic";

const RootApp = dynamic(() => import("../../client/src/RootApp"), { ssr: false });

export function ClientOnlyApp() {
  return <RootApp />;
}
