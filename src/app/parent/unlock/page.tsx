import { unlockParentAction } from "@/app/actions/auth";
import { PinForm } from "@/components/pin-form";
import { Header } from "@/components/header";
import { SectionCard } from "@/components/section-card";
import { Shell } from "@/components/shell";

export default function ParentUnlockPage() {
  return (
    <Shell>
      <Header
        eyebrow="Родительский вход"
        title="Доступ к родительской панели"
        description="Эта часть приложения защищена отдельным PIN-кодом родителя."
        showBack
      />

      <main className="mx-auto grid w-full max-w-xl gap-6">
        <SectionCard
          title="Только для родителя"
          description="После входа будут доступны все дети, история, очередь проверки и настройки."
        >
          <PinForm
            action={unlockParentAction}
            title="PIN родителя"
            description="Введите PIN, чтобы открыть панель одобрения и общий обзор по семье."
            submitLabel="Открыть панель"
          />
        </SectionCard>
      </main>
    </Shell>
  );
}
