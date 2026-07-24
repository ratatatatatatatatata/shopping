import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-4 font-display text-xl font-bold">Хуудас олдсонгүй</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Таны хайсан хуудас байхгүй эсвэл зөөгдсөн байна.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800"
      >
        Нүүр хуудас руу буцах
      </Link>
    </div>
  );
}
