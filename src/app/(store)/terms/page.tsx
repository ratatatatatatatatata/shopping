import { createClient } from "@/lib/supabase/server";
import { EditorialPage } from "@/components/store/EditorialPage";

export const metadata = { title: "Үйлчилгээний нөхцөл" };
export const revalidate = 300;

const FALLBACK = `Orasuits онлайн дэлгүүрээр үйлчлүүлснээр та дараах нөхцөлийг хүлээн зөвшөөрч байна.

Захиалга баталгаажсаны дараа бид барааг нөөцөлж, сонгосон хүргэлтийн хэлбэрийн дагуу хүргэнэ. Барааны үнэ, хямдрал нь захиалга хийсэн үеийн үнээр тооцогдоно.

Төлбөр төлөгдөөгүй захиалга 48 цагийн дараа автоматаар цуцлагдаж болно. Асуулт гарвал холбоо барих хуудсаар бидэнтэй холбогдоно уу.`;

export default async function TermsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "policies")
    .maybeSingle();

  const policies = (data?.value ?? {}) as { terms?: string };
  const body = policies.terms?.trim() || FALLBACK;

  return (
    <EditorialPage
      title="Үйлчилгээний нөхцөл"
      subtitle="Худалдан авалт, захиалгын ерөнхий нөхцөл"
      body={body}
    />
  );
}
