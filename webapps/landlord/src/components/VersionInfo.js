import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip
} from '@material-ui/core';
import {
  Info as InfoIcon,
  NewReleases as ReleaseIcon,
  Security as SecurityIcon,
  BugReport as BugIcon,
  Build as BuildIcon,
  Phone as WhatsAppIcon,
  Language as LanguageIcon
} from '@material-ui/icons';
import useTranslation from 'next-translate/useTranslation';
import { VERSION_INFO } from '../version';

const releaseFeatures = [
  {
    icon: <WhatsAppIcon color="primary" />,
    title: 'WhatsApp Integration',
    description: 'Send invoices and notifications via WhatsApp'
  },
  {
    icon: <SecurityIcon color="secondary" />,
    title: 'Security Enhancements',
    description: 'Rate limiting and JWT security improvements'
  },
  {
    icon: <LanguageIcon color="primary" />,
    title: 'Spanish Localization',
    description: 'Complete Dominican Republic (es-DO) support'
  },
  {
    icon: <BugIcon color="error" />,
    title: 'Bug Fixes',
    description: 'ContactField TypeError and form issues resolved'
  },
  {
    icon: <BuildIcon color="action" />,
    title: 'Infrastructure',
    description: 'Enhanced Docker setup and testing suite'
  }
];

export function VersionInfo({ compact = false }) {
  const { t } = useTranslation('common');
  const [dialogOpen, setDialogOpen] = useState(false);

  if (compact) {
    return (
      <Tooltip title={`Version ${VERSION_INFO.version} - Click for details`}>
        <Chip
          label={VERSION_INFO.version}
          size="small"
          color="primary"
          variant="outlined"
          icon={<InfoIcon />}
          onClick={() => setDialogOpen(true)}
          style={{ cursor: 'pointer' }}
        />
      </Tooltip>
    );
  }

  return (
    <>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body2" color="textSecondary">
          MicroRealEstate
        </Typography>
        <Chip
          label={VERSION_INFO.version}
          size="small"
          color="primary"
          variant="outlined"
          icon={<ReleaseIcon />}
        />
        <IconButton size="small" onClick={() => setDialogOpen(true)}>
          <InfoIcon fontSize="small" />
        </IconButton>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <ReleaseIcon color="primary" />
            <div>
              <Typography variant="h6">
                MicroRealEstate {VERSION_INFO.version}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Released on {VERSION_INFO.releaseDate} • {VERSION_INFO.codename}
              </Typography>
            </div>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            🚀 What's New in This Release
          </Typography>
          
          <List>
            {releaseFeatures.map((feature, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    {feature.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={feature.title}
                    secondary={feature.description}
                  />
                </ListItem>
                {index < releaseFeatures.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              📋 Key Improvements
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>WhatsApp Service:</strong> Complete integration for automated messaging and invoice delivery
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Enhanced Security:</strong> Rate limiting, JWT improvements, and NoSQL injection protection
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Better UX:</strong> Fixed form errors, improved contact management, and language switching
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Infrastructure:</strong> Enhanced Docker setup, comprehensive testing, and better documentation
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              🔧 Bug Fixes
            </Typography>
            <Typography variant="body2" paragraph>
              • Fixed "TypeError: e is not a function" in tenant contact forms
            </Typography>
            <Typography variant="body2" paragraph>
              • Resolved WhatsApp toggle functionality issues
            </Typography>
            <Typography variant="body2" paragraph>
              • Fixed landlord production container problems
            </Typography>
            <Typography variant="body2" paragraph>
              • Patched various security vulnerabilities
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default VersionInfo;
