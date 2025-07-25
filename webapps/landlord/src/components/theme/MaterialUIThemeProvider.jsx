import { ThemeProvider } from '@material-ui/core/styles';
import { createAppTheme } from '../../styles/theme';
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';

export function MaterialUIThemeProvider({ children }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const materialTheme = createAppTheme(isDark);

  return <ThemeProvider theme={materialTheme}>{children}</ThemeProvider>;
}