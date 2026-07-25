import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnimatedSection } from "@/components/store/AnimatedSection";
import { ContactMessageForm } from "@/components/store/ContactMessageForm";

export const metadata = { title: "Холбоо барих" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  // Admin-managed contact info (site_settings.contact)
  let contact: { phone?: string; email?: string; address?: string; hours?: string } = {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "contact")
    .maybeSingle();
  if (data?.value) contact = data.value as typeof contact;

  const items = [
    { icon: Phone, title: "Утас", value: contact.phone || "+976 9999-9999" },
    { icon: Mail, title: "И-мэйл", value: contact.email || "hello@orasuits.mn" },
    { icon: MapPin, title: "Хаяг", value: contact.address || "Улаанбаатар, Монгол" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <AnimatedSection>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Холбоо барих
        </h1>
        <p className="mt-3 text-neutral-500">
          Асуулт байна уу? Бидэнтэй холбогдоорой — бид таньд туслахдаа таатай
          байх болно.
        </p>
      </AnimatedSection>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <AnimatedSection delay={0.1} className="space-y-4">
          {items.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="card flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-neon">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-400">
                    {c.title}
                  </p>
                  <p className="font-semibold">{c.value}</p>
                </div>
              </div>
            );
          })}
          <div className="card flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-neon">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-400">
                Ажиллах цаг
              </p>
              <p className="font-semibold">
                {contact.hours || "Өдөр бүр 10:00 – 22:00"}
              </p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <ContactMessageForm />
        </AnimatedSection>
      </div>
    </div>
  );
}
