import { createTheme } from '@material-ui/core/styles';

// Light theme colors
const lightColors = {
  backgroundColor: '#f3f7fd',
  whiteColor: '#FFFFFF',
  primaryColor: '#2563eb',
  successColor: '#16a34a',
  warningColor: '#f97316',
  defaultColor: '#020817',
  paperColor: '#FFFFFF',
  textPrimary: '#020817',
  textSecondary: '#64748b'
};

// Dark theme colors
const darkColors = {
  backgroundColor: '#0f172a',
  whiteColor: '#f8fafc',
  primaryColor: '#3b82f6',
  successColor: '#22c55e',
  warningColor: '#f59e0b',
  defaultColor: '#f8fafc',
  paperColor: '#1e293b',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8'
};

// Create theme factory function
const createAppTheme = (isDark = false) => {
  const colors = isDark ? darkColors : lightColors;

  return createTheme({
    palette: {
      type: isDark ? 'dark' : 'light',
      primary: {
        main: colors.primaryColor,
        contrastText: colors.whiteColor
      },
      success: {
        main: colors.successColor,
        contrastText: colors.whiteColor
      },
      warning: {
        main: colors.warningColor,
        contrastText: colors.whiteColor
      },
      background: {
        paper: colors.paperColor,
        default: colors.backgroundColor
      },
      text: {
        primary: colors.textPrimary,
        secondary: colors.textSecondary
      }
    },
    overrides: {
      MuiAppBar: {
        colorPrimary: {
          color: colors.textPrimary,
          backgroundColor: colors.paperColor,
          borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0'
        }
      },
      MuiInputAdornment: {
        root: {
          color: colors.textSecondary
        }
      },
      MuiButton: {
        root: {
          color: colors.textPrimary
        },
        containedPrimary: {
          color: colors.whiteColor,
          '&.Mui-selected': {
            backgroundColor: colors.primaryColor
          }
        },
        outlined: {
          borderColor: isDark ? '#475569' : '#d1d5db',
          '&:hover': {
            borderColor: colors.primaryColor,
            backgroundColor: isDark
              ? 'rgba(59, 130, 246, 0.1)'
              : 'rgba(37, 99, 235, 0.04)'
          }
        }
      },
      MuiInput: {
        root: {
          color: colors.textPrimary,
          '&:before': {
            borderBottomColor: isDark ? '#475569' : '#d1d5db'
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottomColor: colors.primaryColor
          }
        }
      },
      MuiInputBase: {
        root: {
          color: colors.textPrimary
        }
      },
      MuiStepIcon: {
        root: {
          color: isDark ? '#475569' : '#d1d5db',
          '&$completed': {
            color: colors.successColor
          },
          '&$active': {
            color: colors.primaryColor
          }
        }
      },
      MuiStepLabel: {
        label: {
          color: colors.textSecondary,
          '&$active': {
            color: colors.textPrimary
          },
          '&$completed': {
            color: colors.textPrimary
          }
        }
      },
      MuiTabs: {
        indicator: {
          backgroundColor: colors.primaryColor
        }
      },
      MuiTab: {
        root: {
          color: colors.textSecondary,
          '&$selected': {
            color: colors.primaryColor
          }
        }
      },
      MuiDialog: {
        paper: {
          backgroundColor: colors.paperColor,
          color: colors.textPrimary
        }
      },
      MuiDialogTitle: {
        root: {
          color: colors.textPrimary
        }
      },
      MuiDialogContent: {
        root: {
          color: colors.textPrimary
        }
      },
      MuiTooltip: {
        tooltip: {
          backgroundColor: isDark ? '#374151' : '#1f2937',
          color: '#f9fafb'
        }
      },
      MuiCircularProgress: {
        root: {
          color: colors.primaryColor
        }
      },
      MuiAccordion: {
        root: {
          backgroundColor: colors.paperColor,
          color: colors.textPrimary,
          '&:before': {
            backgroundColor: isDark ? '#334155' : '#e2e8f0'
          }
        }
      },
      MuiAccordionSummary: {
        root: {
          backgroundColor: colors.paperColor,
          '&:hover': {
            backgroundColor: isDark ? '#334155' : '#f1f5f9'
          }
        }
      }
    }
  });
};

// Export default light theme for backward compatibility
const theme = createAppTheme(false);

export default theme;
export { createAppTheme };
