import { notFound } from "next/navigation";
import { unlockChildAction } from "@/app/actions/auth";
import { PinForm } from "@/components/pin-form";
import { Header } from "@/components/header";
import { SectionCard } from "@/components/section-card";
import { Shell } from "@/components/shell";
import { getChildPageData } from "@/lib/data";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ChildUnlockPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getChildPageData(slug);

  if (!data) {
    notFound();
  }

  return (
    <Shell>
      <Header
        eyebrow={`Вход для ${data.child.name}`}
        title={`Личный вход для ${data.child.name}`}
        description="Введите детский PIN-код, чтобы открыть только этот кабинет."
        showBack
      />

      <main className="mx-auto grid w-full max-w-xl gap-6">
        <SectionCard
          title="Защищенный доступ"
          description="Соседние профили и балансы других детей отсюда не видны."
        >
          <PinForm
            action={unlockChildAction}
            title={`Профиль ${data.child.name}`}
            description="После правильного PIN-кода откроется личный кабинет ребенка."
            submitLabel="Открыть кабинет"
            hiddenFields={[{ name: "slug", value: slug }]}
          />
        </SectionCard>
      </main>
    </Shell>
  );
}
