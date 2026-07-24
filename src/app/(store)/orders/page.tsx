import { redirect } from "next/navigation";

// Order history moved to /account/orders — keep old links working.
export default function OrdersRedirectPage() {
  redirect("/account/orders");
}
