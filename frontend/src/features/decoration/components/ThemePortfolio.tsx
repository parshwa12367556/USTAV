export type PortfolioTheme = { id: string; name: string; imageUrl: string; description?: string };
export function ThemePortfolio({ themes, onSelect }: { themes: PortfolioTheme[]; onSelect?: (theme: PortfolioTheme) => void }) {
  return <div className="theme-portfolio">{themes.map((theme) => <button key={theme.id} type="button" onClick={() => onSelect?.(theme)}>
    <img src={theme.imageUrl} alt="" loading="lazy" /><strong>{theme.name}</strong>{theme.description && <span>{theme.description}</span>}
  </button>)}</div>;
}
