import type { PublicPortfolioLink } from "@pdi-os/domain";

export function ContactFooter({ links }: { links: PublicPortfolioLink[] }) {
  return (
    <footer className="flex flex-col gap-4 border-t border-border py-12">
      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Contato
      </h2>
      {links.length > 0 ? (
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {links.map((link) => (
            <li key={`${link.label}-${link.href}`}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Links em breve.</p>
      )}
    </footer>
  );
}
