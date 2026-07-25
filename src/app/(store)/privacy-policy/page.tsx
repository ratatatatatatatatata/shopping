import { createClient } from "@/lib/supabase/server";
import { EditorialPage } from "@/components/store/EditorialPage";

export const metadata = { title: "Нууцлалын бодлого" };
export const dynamic = "force-dynamic";

const FALLBACK = `Orasuits дэлгүүр таны хувийн мэдээллийг зөвхөн захиалга биелүүлэх, хүргэлт хийх зорилгоор ашигладаг.

Бид таны нэр, утасны дугаар, хаяг, и-мэйл зэрэг мэдээллийг гуравдагч этгээдэд дамжуулдаггүй бөгөөд аюулгүй серверт хадгалдаг.

Та бүртгэлээ устгуулах, мэдээллээ засуулах хүсэлтийг хэдийд ч бидэнд илгээж болно.`;

export default async function PrivacyPolicyPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "policies")
    .maybeSingle();

  const policies = (data?.value ?? {}) as { privacy?: string };
  const body = policies.privacy?.trim() || FALLBACK;

  return (
    <EditorialPage
      title="Нууцлалын бодлого"
      subtitle="Таны хувийн мэдээллийг хэрхэн хамгаалдаг тухай"
      body={body}
    />
  );
}
