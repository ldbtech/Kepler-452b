import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KeplerV — a browser for what you want to do",
  description:
    "Meet KeplerV: an open-source browser built around your goals, visible AI agents, contextual services, and human control.",
};

// Sets the theme before React hydrates, so there's no flash of the wrong
// theme on load. Runs synchronously, blocking paint for a fraction of a ms.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("keplerv_theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-base text-ink">{children}</body>
    </html>
  );
}
