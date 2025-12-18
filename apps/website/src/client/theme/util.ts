import { Theme } from "./enum";

export const isValidTheme = (theme: any): theme is Theme =>
  theme && Object.values(Theme).includes(theme);
