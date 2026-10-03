"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDealer } from "@/lib/dealers";
import { COOKIE_NAME } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const dealerId = String(formData.get("dealerId") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  const dealer = getDealer(dealerId);
  if (!dealer || dealer.password !== password) {
    redirect(`/login?error=1&dealerId=${encodeURIComponent(dealerId)}`);
  }

  const store = await cookies();
  store.set(COOKIE_NAME, dealer.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(next || "/");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  redirect("/login");
}
