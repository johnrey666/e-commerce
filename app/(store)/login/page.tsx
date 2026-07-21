import { Suspense } from "react";
import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = { title: "Log In" };

export default function Page() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
