/**
 * Validates that at least one communication method is configured
 * @param {Object} organization - The organization object
 * @returns {Object} - Validation result with isValid and methods
 */
export function validateCommunicationMethods(organization) {
  const methods = {
    email: false,
    whatsapp: false
  };

  // Check email configuration
  const emailActive =
    !!organization.thirdParties?.gmail?.selected ||
    !!organization.thirdParties?.smtp?.selected ||
    !!organization.thirdParties?.mailgun?.selected;

  if (emailActive) {
    methods.email = true;
  }

  // Check WhatsApp configuration
  const whatsappActive = !!organization.thirdParties?.whatsapp?.accessToken;
  if (whatsappActive) {
    methods.whatsapp = true;
  }

  const isValid = methods.email || methods.whatsapp;

  return {
    isValid,
    methods,
    message: isValid
      ? 'Communication methods configured successfully'
      : 'At least one communication method (email or WhatsApp) must be configured'
  };
}

/**
 * Validates tenant contact information
 * @param {Object} tenant - The tenant object
 * @returns {Object} - Validation result
 */
export function validateTenantContacts(tenant) {
  if (!tenant.contacts || tenant.contacts.length === 0) {
    return {
      isValid: false,
      message: 'At least one contact is required'
    };
  }

  const validContacts = tenant.contacts.filter((contact) => {
    const hasEmail = contact.email && contact.email.trim() !== '';
    const hasWhatsAppPhone =
      (contact.phone1 && contact.whatsapp1) ||
      (contact.phone2 && contact.whatsapp2);

    return hasEmail || hasWhatsAppPhone;
  });

  return {
    isValid: validContacts.length > 0,
    validContacts: validContacts.length,
    totalContacts: tenant.contacts.length,
    message:
      validContacts.length > 0
        ? `${validContacts.length} valid contact(s) found`
        : 'At least one contact must have either email or WhatsApp phone number'
  };
}

/**
 * Gets available communication methods for a tenant
 * @param {Object} tenant - The tenant object
 * @param {Object} organization - The organization object
 * @returns {Object} - Available methods
 */
export function getAvailableCommunicationMethods(tenant, organization) {
  const orgMethods = validateCommunicationMethods(organization);
  const tenantContacts = validateTenantContacts(tenant);

  const available = {
    email: false,
    whatsapp: false,
    contacts: []
  };

  if (orgMethods.methods.email && tenantContacts.isValid) {
    // Check if tenant has email contacts
    const emailContacts =
      tenant.contacts?.filter(
        (contact) => contact.email && contact.email.trim() !== ''
      ) || [];

    if (emailContacts.length > 0) {
      available.email = true;
      available.contacts.push(
        ...emailContacts.map((c) => ({ ...c, method: 'email' }))
      );
    }
  }

  if (orgMethods.methods.whatsapp && tenantContacts.isValid) {
    // Check if tenant has WhatsApp contacts
    const whatsappContacts =
      tenant.contacts?.filter(
        (contact) =>
          (contact.phone1 && contact.whatsapp1) ||
          (contact.phone2 && contact.whatsapp2)
      ) || [];

    if (whatsappContacts.length > 0) {
      available.whatsapp = true;
      available.contacts.push(
        ...whatsappContacts.map((c) => ({ ...c, method: 'whatsapp' }))
      );
    }
  }

  return {
    ...available,
    hasAnyMethod: available.email || available.whatsapp,
    organizationMethods: orgMethods.methods,
    tenantContactsValid: tenantContacts.isValid
  };
}
