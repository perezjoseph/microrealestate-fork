---
inclusion: always
---

# CI/CD Workflow Standards

## Pre-Push Requirements

### Code Quality Checks (Mandatory)
Before pushing any code to GitHub, run these commands in sequence:

```bash
# 1. Run linting across all workspaces
yarn workspaces foreach --parallel run lint

# 2. Run type checking for TypeScript services
yarn workspaces foreach --parallel run type-check

# 3. Run tests to ensure no regressions
yarn workspaces foreach --parallel run test

# 4. Check for security vulnerabilities
yarn audit --level moderate
```

### Pre-commit Hooks
The project uses Husky for automated pre-commit checks:
- **ESLint**: Automatically fixes code style issues
- **Prettier**: Formats code according to project standards
- **Type checking**: Validates TypeScript compilation
- **Test validation**: Runs affected tests

## GitHub Workflow Monitoring

### Post-Push Workflow Verification
After pushing to the `master` branch, monitor the CI/CD pipeline:

```bash
# Wait for GitHub Actions to initialize
sleep 300  # 5 minutes

# Check workflow status using GitHub CLI
gh run list --limit 1 --json status,conclusion,url
gh run view --log  # View detailed logs if needed

# Monitor specific workflow steps
gh run watch  # Real-time monitoring
```

### Workflow Failure Response
If the CI/CD pipeline fails:

1. **Immediate Actions**:
   ```bash
   # Check failure details
   gh run view --log-failed
   
   # Create hotfix branch if critical
   git checkout -b hotfix/pipeline-fix
   ```

2. **Common Failure Patterns**:
   - **Build failures**: Check Docker image compatibility
   - **Test failures**: Run tests locally first
   - **Deployment issues**: Verify environment variables
   - **Security scans**: Address dependency vulnerabilities

## Deployment Pipeline

### Automated Deployment Flow
1. **Trigger**: Push to `master` branch only
2. **Build Phase**: 
   - Parallel Docker image builds for all 12 services
   - Frontend application builds (landlord, tenant)
   - Type definitions compilation
3. **Test Phase**:
   - Unit tests across all workspaces
   - Integration tests for API endpoints
   - E2E tests using Cypress
4. **Security Phase**:
   - Dependency vulnerability scanning
   - Container image security analysis
   - SAST (Static Application Security Testing)
5. **Deploy Phase**:
   - Push images to GitHub Container Registry (ghcr.io)
   - Deploy to CI environment
   - Health checks and smoke tests

### Environment-Specific Deployments
- **CI Environment**: Automatic deployment from `master`
- **Staging**: Manual approval required
- **Production**: Requires additional security reviews

## Required GitHub Secrets

### Deployment Credentials
```bash
# Server access
HOST=your-deployment-server.com
USERNAME=deployment-user
KEY=ssh-private-key-content

# Application URLs for testing
CI_GATEWAY_URL=https://ci-gateway.yourdomain.com
CI_LANDLORD_APP_URL=https://ci-landlord.yourdomain.com
CI_TENANT_APP_URL=https://ci-tenant.yourdomain.com

# Container registry
GHCR_TOKEN=github-container-registry-token
```

### Service Configuration
```bash
# Database connections
MONGODB_URI=mongodb://ci-mongo:27017/microrealestate
VALKEY_URI=redis://ci-valkey:6379

# External services
WHATSAPP_API_TOKEN=your-whatsapp-business-token
STRIPE_SECRET_KEY=sk_test_your-stripe-key
```

## Performance Optimization

### Parallel Execution
- **Docker builds**: Use `--parallel` flag for multi-service builds
- **Workspace operations**: Leverage `yarn workspaces foreach --parallel`
- **Test execution**: Run tests concurrently where possible

### Caching Strategy
- **Docker layer caching**: Optimize Dockerfile layer ordering
- **Node modules**: Cache `node_modules` between builds
- **Build artifacts**: Cache compiled TypeScript and bundled assets

## Monitoring & Alerting

### Pipeline Health Checks
- **Build duration**: Alert if builds exceed 15 minutes
- **Test coverage**: Maintain minimum 80% coverage
- **Deployment success**: Monitor successful deployment rate
- **Performance regression**: Track bundle size increases

### Notification Channels
- **Slack integration**: Real-time build status updates
- **Email alerts**: Critical failure notifications
- **GitHub status checks**: PR merge protection

## Rollback Procedures

### Automated Rollback Triggers
- **Health check failures**: Automatic rollback within 5 minutes
- **Error rate spikes**: Rollback if error rate > 5%
- **Performance degradation**: Rollback if response time > 2x baseline

### Manual Rollback Process
```bash
# Emergency rollback using GitHub CLI
gh workflow run rollback.yml -f version=previous-stable-tag

# Or using Docker tags
docker pull ghcr.io/microrealestate/gateway:previous-stable
docker service update --image ghcr.io/microrealestate/gateway:previous-stable gateway
```

## Branch Protection Rules

### Master Branch Requirements
- **Required status checks**: All CI workflows must pass
- **Required reviews**: Minimum 1 code review for external contributors
- **Up-to-date branches**: Require branches to be up-to-date before merging
- **Administrator enforcement**: Apply rules to administrators

### Pull Request Workflow
1. **Create feature branch**: `feature/description` or `fix/issue-number`
2. **Run local checks**: Lint, test, and type-check before pushing
3. **Create PR**: Include description and link to issues
4. **Automated checks**: Wait for CI pipeline completion
5. **Code review**: Address feedback and re-run checks
6. **Merge**: Use squash merge for clean history

## Development Environment Sync

### Local Environment Validation
```bash
# Ensure local environment matches CI
docker-compose -f docker-compose.local.yml up -d
yarn workspaces foreach --parallel run dev

# Run full test suite locally
yarn workspaces foreach --parallel run test:ci
```

### Environment Parity
- **Node.js version**: Must match `.nvmrc` (22.17.1)
- **Yarn version**: Must use Yarn 3.3.0
- **Docker version**: Minimum Docker 20.10.0
- **Environment variables**: Use `base.env` as template