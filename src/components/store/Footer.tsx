import Link from "next/link";
import { Instagram, Facebook, Phone, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface ContactSettings {
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
}
interface SocialSettings {
  instagram?: string;
  facebook?: string;
}

export async function Footer() {
  // Contact + social links come from admin-managed site_settings
  let contact: ContactSettings = {};
  let social: SocialSettings = {};
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["contact", "social"]);
    for (const row of data ?? []) {
      if (row.key === "contact") contact = row.value as ContactSettings;
      if (row.key === "social") social = row.value as SocialSettings;
    }
  } catch {
    // fall back to defaults below
  }

  const phone = contact.phone || "+976 9999-9999";
  const email = contact.email || "hello@orasuits.mn";
  const address = contact.address || "Улаанбаатар, Монгол";

  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <span className="font-display text-2xl font-bold">
              Orasuits<span className="text-neon">.</span>
            </span>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              Шинэ үеийн streetwear болон premium casual хувцасны онлайн дэлгүүр.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href={social.instagram || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-full bg-white/10 p-2.5 transition-colors hover:bg-neon hover:text-ink"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={social.facebook || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="rounded-full bg-white/10 p-2.5 transition-colors hover:bg-neon hover:text-ink"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
              Дэлгүүр
            </h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link href="/shop" className="hover:text-neon">Бүх бараа</Link></li>
              <li><Link href="/new-arrivals" className="hover:text-neon">Шинэ загварууд</Link></li>
              <li><Link href="/sale" className="hover:text-neon">Хямдрал</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
              Мэдээлэл
            </h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link href="/about" className="hover:text-neon">Бидний тухай</Link></li>
              <li><Link href="/contact" className="hover:text-neon">Холбоо барих</Link></li>
              <li><Link href="/account/orders" className="hover:text-neon">Захиалга хянах</Link></li>
              <li><Link href="/shipping" className="hover:text-neon">Хүргэлтийн мэдээлэл</Link></li>
              <li><Link href="/returns" className="hover:text-neon">Буцаалтын нөхцөл</Link></li>
              <li><Link href="/terms" className="hover:text-neon">Үйлчилгээний нөхцөл</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-neon">Нууцлалын бодлого</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
              Холбоо барих
            </h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-neon" /> {phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-neon" />{" "}
                <span className="break-all">{email}</span>
              </li>
              <li>{address}</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Orasuits. Бүх эрх хуулиар хамгаалагдсан.
        </div>
      </div>
    </footer>
  );
}
