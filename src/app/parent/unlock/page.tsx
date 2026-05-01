import { unlockParentAction } from "@/app/actions/auth";
import { Header } from "@/components/header";
import { PinForm } from "@/components/pin-form";
import { SectionCard } from "@/components/section-card";
import { Shell } from "@/components/shell";

export default function ParentUnlockPage() {
  return (
    <Shell>
      <Header
        variant="gate"
        eyebrow="Родительский вход"
        title="Доступ к родительской панели"
        description="Родительский режим защищен отдельным PIN-кодом. После входа будут доступны ручные действия, недельная проверка и история."
        showBack
      />

      <main className="mx-auto grid w-full max-w-xl gap-6">
        <SectionCard
          title="Только для родителя"
          description="Здесь открывается домашний пульт управления: быстрые начисления, коллективные правила, недельные проверки и очередь на будущее."
        >
          <PinForm
            action={unlockParentAction}
            title="PIN родителя"
            description="Введите PIN, чтобы открыть рабочую панель семьи."
            submitLabel="Открыть панель"
          />
        </SectionCard>
      </main>
    </Shell>
  );
}
