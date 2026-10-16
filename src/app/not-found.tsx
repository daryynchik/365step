import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="text-lg" />
      <div>
        <h1 className="text-2xl font-bold">Такой страницы нет</h1>
        <p className="mt-1 text-muted">Возможно, ссылка устарела.</p>
      </div>
      <ButtonLink href="/path">На главную</ButtonLink>
    </div>
  );
}
