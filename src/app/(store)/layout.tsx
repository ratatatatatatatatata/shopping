import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">{children}</main>
      <CartDrawer />
      <Footer />
    </>
  );
}
