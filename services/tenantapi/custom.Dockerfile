FROM microrealestate-tenantapi

# Create a script to patch the code
WORKDIR /usr/app
USER root
COPY --chmod=755 /tmp/fix_tenant_api.js /usr/app/fix_tenant_api.js

# Find the controllers file and apply our patch
RUN echo "try { require('./fix_tenant_api.js'); } catch (e) { console.error('Failed to apply patch:', e); }" >> /usr/app/services/tenantapi/dist/controllers/tenants.js

USER 1000
CMD ["services/tenantapi/dist/index.js"]
