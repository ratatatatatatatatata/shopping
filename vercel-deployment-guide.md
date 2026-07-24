# Vercel Deployment Guide

## 1. GitHub repo холбох

1. https://vercel.com → **Add New… → Project**
2. **Import Git Repository** → `orasuits-store` repo-гоо сонго
3. Framework Preset: **Next.js** (автоматаар танина)
4. Build командыг өөрчлөх шаардлагагүй (`next build`)

## 2. Environment Variables

**Settings → Environment Variables** (эсвэл import хийх үед):

| Name | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Production, Preview, Development |

⚠️ `service_role` түлхүүрийг ХЭЗЭЭ Ч бүү нэм — энэ төсөлд шаардлагагүй.

## 3. Deploy

**Deploy** товч дар. 1–2 минутын дараа `https://orasuits-store.vercel.app`
маягийн домэйн дээр сайт ажиллана.

Цаашид `main` branch руу push хийх бүрт Vercel автоматаар дахин deploy хийнэ:

```bash
git add .
git commit -m "Update products page"
git push
```

## 4. Supabase Auth URL тохируулах

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://<tanii-domain>.vercel.app`
- **Redirect URLs**: мөн адил домэйн нэмнэ

Ингэснээр и-мэйл баталгаажуулалтын холбоосууд зөв домэйн руу заана.

## 5. Custom domain (заавал биш)

Vercel → **Settings → Domains** → өөрийн домэйн (жишээ нь `orasuits.mn`) нэмж,
DNS дээр Vercel-ийн зааврын дагуу A/CNAME бичлэг тохируулна.

## 6. Түгээмэл асуудлууд

| Асуудал | Шийдэл |
|---|---|
| Build амжилттай ч хуудас хоосон | Env хувьсагчид Production орчинд орсон эсэхийг шалга, redeploy хий |
| Login ажиллахгүй | Supabase URL Configuration дээр Vercel домэйн нэмсэн эсэхээ шалга |
| Бараа харагдахгүй | `supabase-seed.sql` ажилласан эсэх, RLS policy ажилласан эсэхийг шалга |
| Админ хуудас руу орохгүй | `profiles.role = 'admin'` эсэхийг шалга |
| Зураг upload алдаа | Storage bucket + storage policy үүссэн эсэхийг шалга |
