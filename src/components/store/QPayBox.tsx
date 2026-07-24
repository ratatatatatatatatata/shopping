import { QrCode } from "lucide-react";
import { formatPrice } from "@/utils/format";

/**
 * QPay MVP placeholder.
 * Real integration: replace the QR placeholder with the invoice QR image
 * returned by the QPay API (see src/lib/payments/qpay.ts and README).
 */
export function QPayBox({
  amount,
  orderNumber,
}: {
  amount: number;
  orderNumber: string;
}) {
  return (
    <div className="card p-6 text-center">
      <h3 className="font-display text-lg font-bold">QPay төлбөр</h3>
      <div className="mx-auto mt-5 flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-dashed border-ink/15 bg-smoke">
        <div className="text-neutral-400">
          <QrCode className="mx-auto h-16 w-16" />
          <p className="mt-2 text-xs">QPay QR код</p>
          <p className="text-[10px]">(API холболтын дараа гарна)</p>
        </div>
      </div>
      <p className="mt-5 font-display text-2xl font-bold">{formatPrice(amount)}</p>
      <p className="mt-1 text-xs text-neutral-500">Захиалга: {orderNumber}</p>
      <p className="mt-4 rounded-xl bg-smoke p-3 text-sm text-neutral-600">
        QPay ашиглан QR код уншуулж төлбөрөө төлнө үү.
      </p>
      <p className="mt-3 text-xs text-neutral-400">
        Төлбөр баталгаажсаны дараа захиалга автоматаар шинэчлэгдэнэ. Асуудал
        гарвал бидэнтэй холбогдоно уу.
      </p>
    </div>
  );
}
