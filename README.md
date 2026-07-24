# ХЭТ (KHET) — Fashion E-commerce Platform (v2)

Монголын залуу үеийнхэнд зориулсан хувцас, гутал, цүнх, аксессуарын
production-ready онлайн дэлгүүр. Next.js 15 + Supabase + Vercel.

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion ·
React Hook Form + Zod · Three.js / React Three Fiber / Drei (3D үзүүлэн) ·
Supabase (PostgreSQL, Auth, Storage, RLS) · Zustand · Recharts · Vercel · GitHub

## Features

**Storefront (Монгол хэлээр):** нүүр (hero, коллекц, шинэ/эрэлттэй/хямдралтай
рэйлүүд, брэнд стори, сэтгэгдэл, newsletter), /shop (хайлт + ангилал, брэнд,
хүйс, размер, өнгө, үнэ, үлдэгдэлтэй, хямдралтай шүүлтүүр + 5 эрэмбэ +
хуудаслалт), /category/[slug], /product/[slug] (өнгө сонгоход зураг солигдоно,
олон зурагтай галерей, сонголтоор GLB/GLTF 3D үзүүлэн, размерын үлдэгдэл,
sale үнэ + хямдралын %, материал/арчилгаа, сэтгэгдэл, төстэй + сүүлд үзсэн
бараа, SEO metadata + Product/Breadcrumb JSON-LD), /search, /wishlist
(нэвтэрсэн үед Supabase-тэй синк хийнэ), сагс (guest — localStorage),
захиалга (RHF+Zod, хот/дүүрэг/хороо, хүргэлтийн арга, купон код), төлбөр
(QPay / банкны шилжүүлэг / бэлнээр — бодит provider холбоход бэлэн интерфейс,
хуурамч "амжилттай" flow байхгүй), хэрэглэгчийн бүртгэл + хадгалсан хаяг +
захиалгын түүх, бодлогын хуудсууд, sitemap.xml + robots.txt.

**Admin (/admin, role-based):** dashboard (сарын орлого, захиалга, хэрэглэгч,
бараа, бага/дууссан үлдэгдэл, график, эрэлттэй бараа, realtime мэдэгдэл),
бараа (draft → publish → archive workflow, publish дархад storefront шууд
шинэчлэгдэнэ — redeploy шаардлагагүй, хуулбарлах, олон зурагтай галерей +
cover + alt + өнгөнд оноох, GLB/GLTF 3D загвар upload, SEO талбарууд, sale
хугацаа, брэнд quick-create), variant бүрийн үнэ/sale/үлдэгдэл (үлдэгдлийн
өөрчлөлт бүр inventory_transactions-д бүртгэгдэнэ), ангилал CRUD (эцэг
ангилалтай), захиалга (статус workflow, төлбөр баталгаажуулах, tracking,
дотоод тэмдэглэл, цуцлахад үлдэгдэл сэргэнэ, CSV export, нэхэмжлэх хэвлэх),
хэрэглэгчид (түүх, нийт зарцуулалт, идэвхгүй болгох), купон (хувь/тогтмол/
үнэгүй хүргэлт, хязгаар, хугацаа), агуулга (hero/promo банер, холбоо барих,
данс, бодлогууд), үйл ажиллагааны лог.

**Аюулгүй байдал:** бүх эрх RLS дээр (35+ бодлого), admin/super_admin role
server талд шалгагдана (middleware + layout), хэрэглэгч өөрийгөө админ
болгох боломжгүй, service-role түлхүүр хаана ч ашиглагдаагүй.

---

## 1. Суулгах

```bash
npm install
cp .env.example .env.local   # утгуудыг бөглө (алхам 2)
npm run dev                  # http://localhost:3000
```

## 2. Supabase төсөл үүсгэх

1. [supabase.com](https://supabase.com) → **New project**
2. **Settings → API** → `Project URL` болон `anon public` түлхүүрийг
   `.env.local`-д хуулна. `NEXT_PUBLIC_SITE_URL`-д dev үед
   `http://localhost:3000` тавина.

> ⚠️ `service_role` түлхүүрийг frontend болон `NEXT_PUBLIC_` хувьсагчид
> хэзээ ч бүү тавь. Энэ төсөлд шаардлагагүй.

## 3. SQL ажиллуулах (дарааллаар!)

SQL Editor дээр:

1. `supabase-schema.sql` — 25+ хүснэгт, trigger, функц, storage bucket
2. `supabase-rls-policies.sql` — Row Level Security
3. `supabase-seed.sql` — жишээ брэнд/ангилал/бараа/купон/агуулга

## 4. Super admin үүсгэх

1. Сайтын `/register` хуудсаар бүртгүүл.
2. SQL Editor:

```sql
update public.profiles set role = 'super_admin' where email = 'your-admin@email.com';
```

3. `/admin/login`-оор нэвтэр. (Нэмэлт админ: role = 'admin')

Dev үед и-мэйл баталгаажуулалт саад болвол: Authentication → Providers →
Email → "Confirm email"-г унтраа.

## 5. GitHub + Vercel deploy

```bash
git init && git add . && git commit -m "KHET v2"
git branch -M main
git remote add origin https://github.com/<you>/khet-store.git
git push -u origin main
```

Vercel → Add New → Project → repo import → Environment Variables:

| Name | Утга |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://<tanii-app>.vercel.app` (localhost БИШ) |

Deploy хийсний дараа Supabase → Authentication → URL Configuration дээр
Site URL-ыг Vercel домэйноор тохируул. Дэлгэрэнгүй:
`deployment-guide.md`, `vercel-deployment-guide.md`.

## 6. Бараа нийтлэх workflow

Admin → Бараа → Бараа нэмэх → мэдээлэл, өнгө/размер/үлдэгдэл, зургууд →
**Ноорог хадгалах** → Preview → **Нийтлэх**. Publish дармагц
`revalidatePath` ажиллаж дэлгүүрт шууд гарна — Vercel redeploy
шаардлагагүй. Unpublish хийвэл дэлгүүрээс алга болно, дата хадгалагдана.

## 7. 3D загвар

Барааны форм дээр `.glb`/`.gltf` файл (≤20MB) upload хийх эсвэл URL оруулна
(`product-models` bucket). Байгаа үед product хуудсанд "3D үзэх" товч гарч
чирж эргүүлэх, томруулах боломжтой viewer нээгдэнэ; viewport-оос гарахад
рендер зогсоно, WebGL ажиллахгүй бол зурган fallback харагдана. 3D загвар
заавал биш.

## 8. QPay бодит холболт

`src/lib/payments/provider.ts` — provider интерфейс,
`src/lib/payments/qpay.ts` — QPay API skeleton (token, invoice, check).
Vercel дээр `QPAY_USERNAME`, `QPAY_PASSWORD`, `QPAY_INVOICE_CODE` (server-side)
нэмээд invoice үүсгэх + `/api/qpay/callback` handler бичихэд л бэлэн.

## Project structure

```
src/
  app/(store)/        # storefront (21 route)
  app/admin/          # admin login + (panel)/ 10 route
  app/sitemap.ts, robots.ts
  components/store|admin|ui/
  hooks/              # useCart, useWishlist, useUser
  lib/                # supabase clients, actions, payments, validation
  types/  utils/  styles/
supabase-schema.sql · supabase-rls-policies.sql · supabase-seed.sql
```
