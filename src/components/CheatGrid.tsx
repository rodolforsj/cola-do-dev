import type { CodeEntry } from "@/src/types/cheats";
import { CheatCard } from "@/src/components/CheatCard";

type CheatGridProps = {
  cheats: CodeEntry[];
  favoriteIds: Set<string>;
  onCopied: () => void;
  onToggleFavorite: (id: string) => void;
};

export function CheatGrid({
  cheats,
  favoriteIds,
  onCopied,
  onToggleFavorite,
}: CheatGridProps) {
  if (cheats.length === 0) {
    return null;
    /*
    return (
      <section className="mt-5 rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center">
        <h3 className="text-base font-semibold">Nenhum comando copiável</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ajuste os filtros ou refine a busca.
        </p>
      </section>
    ); 
    */
  }

  return (
    <section className="mt-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cheats.map((cheat) => (
          <CheatCard
            key={cheat.id}
            cheat={cheat}
            isFavorite={favoriteIds.has(cheat.id)}
            onCopied={onCopied}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}
