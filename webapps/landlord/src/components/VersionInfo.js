import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography
} from '@material-ui/core';
import {
  BugReport as BugIcon,
  Build as BuildIcon,
  Info as InfoIcon,
  Language as LanguageIcon,
  NewReleases as ReleaseIcon,
  Security as SecurityIcon,
  Phone as WhatsAppIcon
} from '@material-ui/icons';
import useTranslation from 'next-translate/useTranslation';

import { VERSION_INFO } from '../version';

const releaseFeatures = [
  {
    icon: <WhatsAppIcon color="primary" />,
    title: 'WhatsApp Integration',
    description: 'Complete messaging system for invoices and notifications'
  },
  {
    icon: <SecurityIcon color="secondary" />,
    title: 'Enhanced Security',
    description: 'Rate limiting, JWT improvements, and NoSQL protection'
  },
  {
    icon: <LanguageIcon color="primary" />,
    title: 'Multi-language Support',
    description:
      'Support for 6 languages including Spanish (Dominican Republic)'
  },
  {
    icon: <BugIcon color="success" />,
    title: 'Production Ready',
    description: 'Comprehensive bug fixes and stability improvements'
  },
  {
    icon: <BuildIcon color="action" />,
    title: 'Microservices Architecture',
    description: 'Complete containerized infrastructure with 9+ services'
  }
];

export function VersionInfo({ compact = false }) {
  const { t } = useTranslation('common');
  const [dialogOpen, setDialogOpen] = useState(false);

  if (compact) {
    return (
      <Tooltip
        title={`Version ${VERSION_INFO.version} (${VERSION_INFO.commit}) - Click for details`}
      >
        <Chip
          label={`${VERSION_INFO.version} (${VERSION_INFO.commit})`}
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
          label={`${VERSION_INFO.version} (${VERSION_INFO.commit})`}
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
                Released on {VERSION_INFO.releaseDate} • {VERSION_INFO.codename}{' '}
                • Commit: {VERSION_INFO.commit}
              </Typography>
            </div>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="h6" gutterBottom>
            What&apos;s New in This Release
          </Typography>

          <List>
            {releaseFeatures.map((feature, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>{feature.icon}</ListItemIcon>
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
              Production Features
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Complete Property Management:</strong> Full-featured
              system for landlords and property managers
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>WhatsApp Integration:</strong> Automated messaging,
              invoice delivery, and tenant communication
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Multi-language Support:</strong> Available in English,
              French, German, Spanish, Portuguese, and more
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Microservices Architecture:</strong> Scalable,
              containerized infrastructure with 9+ specialized services
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Enhanced Security:</strong> Rate limiting, JWT
              authentication, NoSQL injection protection
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Infrastructure Services
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Gateway Service:</strong> API routing and load balancing
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Authentication Service:</strong> Secure user management
              and JWT handling
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Core API:</strong> Business logic and data management
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>WhatsApp Service:</strong> Messaging and notification
              delivery
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>PDF Generator:</strong> Document creation and template
              processing
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Email Service:</strong> Automated email notifications
              and receipts
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Stability & Reliability
            </Typography>
            <Typography variant="body2" paragraph>
              • Fixed critical ContactField TypeError in tenant management forms
            </Typography>
            <Typography variant="body2" paragraph>
              • Resolved WhatsApp toggle functionality across all contact forms
            </Typography>
            <Typography variant="body2" paragraph>
              • Enhanced form state management with proper Formik integration
            </Typography>
            <Typography variant="body2" paragraph>
              • Improved container stability and production deployment
              reliability
            </Typography>
            <Typography variant="body2" paragraph>
              • Comprehensive security vulnerability patches and updates
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
