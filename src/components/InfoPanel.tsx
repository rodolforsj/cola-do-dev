import { Star } from "lucide-react";
import type { InfoEntry } from "@/src/types/cheats";

type InfoPanelProps = {
  panel: InfoEntry;
  // Adicionamos as novas propriedades aqui:
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
};

export function InfoPanel({ panel, isFavorite, onToggleFavorite }: InfoPanelProps) {
  return (
    <article className="rounded-lg bg-[var(--surface)]/65 px-3 py-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          {panel.title}
        </h3>
        
        {/* Adicionamos o botão de estrela igual ao do CheatCard */}
        <button
          type="button"
          onClick={() => onToggleFavorite(panel.id)}
          aria-label={
            isFavorite
              ? `Remover ${panel.title} dos favoritos`
              : `Adicionar ${panel.title} aos favoritos`
          }
          aria-pressed={isFavorite}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
        >
          <Star
            className={[
              "h-4 w-4",
              isFavorite
                ? "fill-[var(--accent)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--accent)]",
            ].join(" ")}
            aria-hidden="true"
          />
        </button>
      </div>

      <ul className="mt-1.5 space-y-1 pl-5 text-sm text-[var(--text)]">
        {panel.items.map((item) => (
          <li key={item} className="list-disc">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
