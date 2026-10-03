import LoginForm from "@/components/LoginForm";
import { DEALERS } from "@/lib/dealers";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; dealerId?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
            k
          </div>
          <h1 className="text-xl font-semibold text-neutral-100">keplerv</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Sign in to your dealer account to see live auctions and AI recommendations
            tailored to your inventory.
          </p>
        </div>

        <LoginForm
          dealers={DEALERS}
          next={params.next ?? "/"}
          initialError={params.error === "1"}
          initialDealerId={params.dealerId ?? null}
        />
      </div>
    </div>
  );
}
