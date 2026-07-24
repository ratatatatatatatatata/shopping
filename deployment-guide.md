# Deployment Guide (Supabase + GitHub + Vercel)

Энэ заавар нь төслийг эхнээс нь production хүртэл байршуулах бүрэн дараалал.

## Урьдчилсан шаардлага

- Node.js 18.18+ (20 LTS зөвлөнө)
- GitHub бүртгэл
- Vercel бүртгэл
- Supabase бүртгэл

## Алхам 1 — Supabase төсөл үүсгэх

1. https://supabase.com → **New project** (нэр: `khet-store`, Region: Singapore ойр).
2. Project үүссэний дараа **Settings → API**:
   - `Project URL`
   - `anon public` key
   хоёрыг тэмдэглэж ав.

## Алхам 2 — Database бэлтгэх

**SQL Editor** дээр дарааллаар нь ажиллуул:

| Дараалал | Файл | Юу хийдэг |
|---|---|---|
| 1 | `supabase-schema.sql` | Бүх хүснэгт, trigger, функц, storage bucket |
| 2 | `supabase-rls-policies.sql` | Row Level Security дүрмүүд |
| 3 | `supabase-seed.sql` | Жишээ ангилал, бараа (заавал биш) |

Шалгах: **Table Editor** дээр `products`, `orders` гэх мэт хүснэгтүүд
харагдаж байх ёстой. **Storage** дээр `product-images`, `category-images`
bucket үүссэн байна.

## Алхам 3 — Локал тохиргоо

```bash
cp .env.example .env.local
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

```bash
npm install
npm run dev
```

## Алхам 4 — Админ эрх олгох

1. Сайт дээр `/register` хуудсаар бүртгүүл.
2. SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'admin@tanii-mail.mn';
```

3. `/admin/login` хуудсаар нэвтэр.

## Алхам 5 — GitHub руу push хийх

```bash
git init
git add .
git commit -m "Initial commit: KHET store"
git branch -M main
git remote add origin https://github.com/<username>/khet-store.git
git push -u origin main
```

`.gitignore` нь `.env.local`-г hамгаалдаг — нууц түлхүүр GitHub руу орохгүй.

## Алхам 6 — Vercel дээр deploy хийх

`vercel-deployment-guide.md` файлыг үз.

## Алхам 7 — Production шалгалт

- [ ] Нүүр хуудас ачаалагдаж, бараанууд харагдана
- [ ] Бүртгүүлэх / нэвтрэх ажиллана
- [ ] Өнгө сонгоход зураг солигдоно
- [ ] Сагс → захиалга → төлбөрийн хуудас бүрэн ажиллана
- [ ] Захиалга Supabase `orders` хүснэгтэд хадгалагдана
- [ ] Админ нэвтэрч бараа нэмж/засаж чадна
- [ ] Админ захиалгын статус өөрчилж чадна

## Анхаарах аюулгүй байдал

- `service_role` түлхүүрийг хэзээ ч frontend-д бүү ашигла.
- Бүх эрхийн хяналт RLS дээр тулгуурласан — `is_admin()` функц
  админ үйлдлүүдийг хамгаална.
- Хэрэглэгч өөрийн л захиалга/сагсыг харна.
