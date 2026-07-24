import { createClient } from "@/lib/supabase/server";
import { EditorialPage } from "@/components/store/EditorialPage";

export const metadata = { title: "Буцаалтын нөхцөл" };
export const revalidate = 300;

const FALLBACK = `Худалдан авсан барааг хүлээн авснаас хойш 7 хоногийн дотор буцаах боломжтой.

Буцаах бараа нь өмсөөгүй, угаагаагүй, шошго нь бүрэн байх шаардлагатай. Хямдралтай авсан барааг зөвхөн солих боломжтой.

Буцаалт хийхийн тулд захиалгын дугаараа бэлдээд холбоо барих хуудсаар эсвэл утсаар бидэнтэй холбогдоно уу. Төлбөрийг ажлын 3–5 өдөрт багтаан буцаан шилжүүлнэ.`;

export default async function ReturnsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "policies")
    .maybeSingle();

  const policies = (data?.value ?? {}) as { returns?: string };
  const body = policies.returns?.trim() || FALLBACK;

  return (
    <EditorialPage
      title="Буцаалтын нөхцөл"
      subtitle="Бараа буцаах, солих журам"
      body={body}
    />
  );
}
