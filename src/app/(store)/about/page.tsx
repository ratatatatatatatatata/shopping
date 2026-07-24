import { AnimatedSection } from "@/components/store/AnimatedSection";

export const metadata = { title: "Бидний тухай" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <AnimatedSection>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Бид бол <span className="text-gradient">ХЭТ</span>
        </h1>
        <p className="mt-6 leading-relaxed text-neutral-600">
          ХЭТ нь Монголын залуу үеийнхэнд зориулсан streetwear болон premium
          casual хувцасны онлайн дэлгүүр. Бид &ldquo;хэт&rdquo; гэдэг үгийг
          хязгаараас давах, өөрийнхөөрөө байх гэсэн утгаар сонгосон.
        </p>
        <p className="mt-4 leading-relaxed text-neutral-600">
          Бидний зорилго — чанартай материал, орчин үеийн загвар, боломжийн
          үнийг нэг дор нэгтгэж, хүн бүр өөрийн стилийг чөлөөтэй илэрхийлэх
          боломжийг олгох явдал юм.
        </p>
      </AnimatedSection>
      <AnimatedSection delay={0.15} className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { num: "2026", label: "Байгуулагдсан он" },
          { num: "1000+", label: "Сэтгэл хангалуун хэрэглэгч" },
          { num: "24-48ц", label: "Хүргэлтийн хугацаа" },
        ].map((s) => (
          <div key={s.label} className="card p-6 text-center">
            <p className="font-display text-2xl font-bold text-gradient">{s.num}</p>
            <p className="mt-1 text-sm text-neutral-500">{s.label}</p>
          </div>
        ))}
      </AnimatedSection>
    </div>
  );
}
