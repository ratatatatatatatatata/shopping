import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/store/CheckoutForm";

export const metadata = { title: "Захиалга" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold">Захиалга</h1>
      <CheckoutForm
        defaultName={profile?.full_name ?? ""}
        defaultEmail={profile?.email ?? user?.email ?? ""}
        defaultPhone={profile?.phone ?? ""}
      />
    </div>
  );
}
