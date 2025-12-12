import { useContext } from "react";

import { Links, Meta, ScrollRestoration } from "react-router";
import { useTheme } from "~/client/theme";
import { ThemeScript } from "~/client/theme/script";
import { NonceContext } from "../context/nonce";

export function RootLayout({ children }: React.PropsWithChildren) {
  const nonce = useContext(NonceContext);
  const theme = useTheme();

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <ThemeScript nonce={nonce} theme={theme} />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
      </body>
    </html>
  );
}
