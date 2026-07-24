import { Truck, Zap, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditorialPage } from "@/components/store/EditorialPage";
import {
  DELIVERY_FEE,
  EXPRESS_FEE,
  FREE_DELIVERY_OVER,
} from "@/lib/constants";
import { formatPrice } from "@/utils/format";

export const metadata = { title: "Хүргэлтийн мэдээлэл" };
export const revalidate = 300;

const FALLBACK = `Улаанбаатар хот дотор энгийн хүргэлт 24–48 цагийн дотор хийгдэнэ. Шуурхай хүргэлтээр өдөртөө багтаан хүргэнэ.

Орон нутгийн захиалгыг унаанд тавьж, тээврийн зардлыг хүлээн авагч хариуцна. Дэлгүүрээс өөрийн биеэр авах бол хүргэлтийн төлбөргүй.

Хүргэлтийн явцын мэдээллийг захиалгын түүх хэсгээс болон утсаар авах боломжтой.`;

export default async function ShippingPage() {
  const supabase = await createClient();
  const [{ data: policiesRow }, { data: deliveryRow }] = await Promise.all([
    supabase.from("site_settings").select("value").eq("key", "policies").maybeSingle(),
    supabase.from("site_settings").select("value").eq("key", "delivery").maybeSingle(),
  ]);

  const policies = (policiesRow?.value ?? {}) as { shipping?: string };
  const delivery = (deliveryRow?.value ?? {}) as {
    standard_fee?: number;
    express_fee?: number;
    free_delivery_over?: number;
  };

  const body = policies.shipping?.trim() || FALLBACK;
  const standardFee = Number(delivery.standard_fee ?? DELIVERY_FEE);
  const expressFee = Number(delivery.express_fee ?? EXPRESS_FEE);
  const freeOver = Number(delivery.free_delivery_over ?? FREE_DELIVERY_OVER);

  const options = [
    {
      icon: Truck,
      title: "Энгийн хүргэлт",
      desc: "УБ хот дотор 24–48 цагт",
      fee: formatPrice(standardFee),
    },
    {
      icon: Zap,
      title: "Шуурхай хүргэлт",
      desc: "Өдөртөө багтаан хүргэнэ",
      fee: formatPrice(expressFee),
    },
    {
      icon: Store,
      title: "Дэлгүүрээс авах",
      desc: "Өөрийн биеэр ирж авах",
      fee: "Үнэгүй",
    },
  ];

  return (
    <EditorialPage
      title="Хүргэлтийн мэдээлэл"
      subtitle={`${formatPrice(freeOver)}-с дээш захиалгад хүргэлт үнэгүй`}
      body={body}
    >
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {options.map((o) => {
          const Icon = o.icon;
          return (
            <div key={o.title} className="card p-5">
              <Icon className="h-5 w-5 text-electric" />
              <p className="mt-3 text-sm font-semibold">{o.title}</p>
              <p className="mt-1 text-xs text-neutral-500">{o.desc}</p>
              <p className="mt-3 font-display font-bold">{o.fee}</p>
            </div>
          );
        })}
      </div>
    </EditorialPage>
  );
}
