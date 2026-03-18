"use client";

import { FileText, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/src/components/Header";
import { SubFilterBar } from "@/src/components/SubFilterBar";
import { SidebarNav, type SidebarFilter } from "@/src/components/SidebarNav";
import { InfoPanel } from "@/src/components/InfoPanel";
import { CheatGrid } from "@/src/components/CheatGrid";
import { cheats } from "@/src/data/cheats";
import {
  categories,
  isCodeEntry,
  isInfoEntry,
} from "@/src/types/cheats";

type SubCategoryFilter = "Todas" | string;

const sidebarOptions: SidebarFilter[] = ["Todas", ...categories, "Favoritos"];
const FAVORITES_STORAGE_KEY = "cola-do-dev:favorites";

function matchesQuery(
  entry: (typeof cheats)[number],
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) {
    return true;
  }

  if (entry.type === "info") {
    const infoSearchable = [entry.title, ...entry.items].join(" ");
    return infoSearchable.toLowerCase().includes(normalizedQuery);
  }

  const codeSearchable = [entry.title, entry.description, entry.code].join(" ");
  return codeSearchable.toLowerCase().includes(normalizedQuery);
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SidebarFilter>("Todas");
  const [activeSubCategory, setActiveSubCategory] =
    useState<SubCategoryFilter>("Todas");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const hasLoadedFavoritesRef = useRef(false);

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  useEffect(() => {
    queueMicrotask(() => {
      let loadedFavorites: string[] = [];

      try {
        const rawValue = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

        if (rawValue) {
          const parsedValue: unknown = JSON.parse(rawValue);

          if (Array.isArray(parsedValue)) {
            loadedFavorites = parsedValue.filter(
              (value): value is string => typeof value === "string",
            );
          }
        }
      } catch {
        loadedFavorites = [];
      }

      hasLoadedFavoritesRef.current = true;
      setFavoriteIds(loadedFavorites);
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedFavoritesRef.current) {
      return;
    }

    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      if (event.key === "Escape") {
        if (isMobileSidebarOpen) {
          setIsMobileSidebarOpen(false);
          return;
        }

        const hasOpenDialog = Boolean(
          document.querySelector('[role="dialog"][aria-modal="true"]'),
        );

        if (hasOpenDialog) {
          return;
        }

        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, 1300);

    return () => {
      clearTimeout(timeout);
    };
  }, [toastMessage]);

  const queryMatchedEntries = useMemo(
    () => cheats.filter((entry) => matchesQuery(entry, normalizedQuery)),
    [normalizedQuery],
  );

  const sidebarCounts = useMemo(() => {
    const counts = Object.fromEntries(
      sidebarOptions.map((option) => [option, 0]),
    ) as Record<SidebarFilter, number>;

    counts.Todas = queryMatchedEntries.length;
    counts.Favoritos = queryMatchedEntries.filter((entry) =>
      favoriteIdSet.has(entry.id),
    ).length;

    queryMatchedEntries.forEach((entry) => {
      counts[entry.category] += 1;
    });

    return counts;
  }, [queryMatchedEntries, favoriteIdSet]);

  const laravelSubCategories = useMemo(() => {
    if (activeCategory !== "Laravel") {
      return [];
    }

    return Array.from(
      new Set(
        cheats
          .filter((entry) => entry.category === "Laravel")
          .filter((entry) => matchesQuery(entry, normalizedQuery))
          .map((entry) => entry.subCategory)
          .filter((subCategory): subCategory is string => Boolean(subCategory)),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [activeCategory, normalizedQuery]);

  const effectiveSubCategory = useMemo(() => {
    if (activeCategory !== "Laravel") {
      return "Todas";
    }

    if (
      activeSubCategory !== "Todas" &&
      !laravelSubCategories.includes(activeSubCategory)
    ) {
      return "Todas";
    }

    return activeSubCategory;
  }, [activeCategory, activeSubCategory, laravelSubCategories]);

  const filteredEntries = useMemo(() => {
    return cheats.filter((entry) => {
      const matchesCategory =
        activeCategory === "Todas"
          ? true
          : activeCategory === "Favoritos"
            ? favoriteIdSet.has(entry.id)
            : entry.category === activeCategory;

      if (!matchesCategory) {
        return false;
      }

      const matchesSubCategory =
        activeCategory !== "Laravel" ||
        effectiveSubCategory === "Todas" ||
        entry.subCategory === effectiveSubCategory;

      if (!matchesSubCategory) {
        return false;
      }

      return matchesQuery(entry, normalizedQuery);
    });
  }, [activeCategory, effectiveSubCategory, favoriteIdSet, normalizedQuery]);

  const visibleInfoPanels = useMemo(
    () => filteredEntries.filter(isInfoEntry),
    [filteredEntries],
  );

  const visibleCodeCards = useMemo(
    () => filteredEntries.filter(isCodeEntry),
    [filteredEntries],
  );

  const handleSidebarChange = (option: SidebarFilter) => {
    setActiveCategory(option);
    setActiveSubCategory("Todas");
    setIsMobileSidebarOpen(false);
  };

  const handleToggleFavorite = (id: string) => {
    setFavoriteIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }

      return [...previous, id];
    });
  };

  // Função para limpar todos os filtros e resetar a busca
  const handleClearFilters = () => {
    setQuery("");
    setActiveCategory("Todas");
    setActiveSubCategory("Todas");
  };

  return (
    <>
      <main className="min-h-screen lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
        <aside className="hidden h-screen border-r border-[var(--border)] bg-[var(--surface)]/80 lg:sticky lg:top-0 lg:flex lg:flex-col">
          <div className="flex h-14 items-center gap-2 border-b border-[var(--border)] px-4">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent-strong)]">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">Cola do Dev</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <SidebarNav
              options={sidebarOptions}
              activeOption={activeCategory}
              counts={sidebarCounts}
              onOptionChange={handleSidebarChange}
            />
          </div>
        </aside>

        <section className="min-w-0">
          <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-bottom)]/90 px-4 backdrop-blur md:px-6">
            <Header
              query={query}
              total={cheats.length}
              filteredTotal={filteredEntries.length}
              onQueryChange={setQuery}
              onShowFavorites={() => handleSidebarChange("Favoritos")}
              onOpenMenu={() => setIsMobileSidebarOpen(true)}
              inputRef={searchInputRef}
            />

            {activeCategory === "Laravel" ? (
              <div className="pb-2">
                <SubFilterBar
                  options={["Todas", ...laravelSubCategories]}
                  activeOption={effectiveSubCategory}
                  onOptionChange={setActiveSubCategory}
                />
              </div>
            ) : null}
          </div>

          <div className="px-4 py-4 md:px-6 md:py-5">
            {filteredEntries.length === 0 ? (
              <section className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 flex flex-col items-center justify-center text-center">
                
                {/* Lógica dinâmica de Empty State */}
                {activeCategory === "Favoritos" && favoriteIdSet.size === 0 ? (
                  <>
                    <h2 className="text-base font-semibold">Você ainda não tem favoritos</h2>
                    <p className="mt-1 mb-5 text-sm text-[var(--muted)]">
                      Navegue pelas categorias e marque os comandos que você mais usa.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Explorar Comandos
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-base font-semibold">Nenhum resultado encontrado</h2>
                    <p className="mt-1 mb-5 text-sm text-[var(--muted)]">
                      Tente outro termo de busca ou ajuste os filtros.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-strong)]"
                    >
                      Limpar Filtros
                    </button>
                  </>
                )}

              </section>
            ) : (
              <>
                {visibleInfoPanels.length > 0 ? (
                  <section className="space-y-2">
                    {visibleInfoPanels.map((panel) => (
                      <InfoPanel 
                        key={panel.id} 
                        panel={panel} 
                        // Enviando os dados novos:
                        isFavorite={favoriteIdSet.has(panel.id)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </section>
                ) : null}

                <CheatGrid
                  cheats={visibleCodeCards}
                  favoriteIds={favoriteIdSet}
                  onCopied={() => {
                    setToastMessage("Copiado!");
                  }}
                  onToggleFavorite={handleToggleFavorite}
                />
              </>
            )}
          </div>
        </section>
      </main>

      {/* Menus mobile e Toasts mantidos iguais... */}
      <div
        className={[
          "fixed inset-0 z-50 lg:hidden",
          isMobileSidebarOpen ? "" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!isMobileSidebarOpen}
      >
        <button
          type="button"
          className={[
            "absolute inset-0 bg-slate-900/45 transition-opacity",
            isMobileSidebarOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-label="Fechar menu de categorias"
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        <aside
          className={[
            "absolute inset-y-0 left-0 w-72 max-w-[86vw] border-r border-[var(--border)] bg-[var(--surface)] transform transition-transform duration-200",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de categorias"
        >
          <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent-strong)]">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold">Categorias</span>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:bg-[var(--surface-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="p-3">
            <SidebarNav
              options={sidebarOptions}
              activeOption={activeCategory}
              counts={sidebarCounts}
              onOptionChange={handleSidebarChange}
            />
          </div>
        </aside>
      </div>

      <div
        className={[
          "pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 transition-all duration-200",
          toastMessage ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        {toastMessage ?? " "}
      </div>
    </>
  );
}