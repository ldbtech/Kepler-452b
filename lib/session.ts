import "server-only";
import { cookies } from "next/headers";
import { DEALERS, getDealer, type Dealer } from "@/lib/dealers";

const COOKIE_NAME = "dealer_id";

export async function getCurrentDealer(): Promise<Dealer> {
  const store = await cookies();
  const dealer = getDealer(store.get(COOKIE_NAME)?.value);
  // Middleware guarantees this on protected routes; fall back defensively.
  return dealer ?? DEALERS[0];
}

export { COOKIE_NAME };
