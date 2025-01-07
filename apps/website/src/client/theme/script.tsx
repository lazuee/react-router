import { useIsomorphicLayoutEffect } from "usehooks-ts";

import { type Theme } from "./";

export const ThemeScript = ({
  nonce,
  theme,
}: {
  nonce?: string;
  theme: Theme;
}) => {
  useIsomorphicLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.dataset.theme = ${JSON.stringify(theme)};`,
      }}
    />
  );
};
