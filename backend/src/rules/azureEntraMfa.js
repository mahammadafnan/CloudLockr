/**
 * CIS Azure Foundations Benchmark 1.1 - Ensure Multi-Factor Authentication is Enabled for All Privileged Users in Entra ID
 */
module.exports = {
  id: 'CL-AZURE-03',
  title: 'Azure Entra ID Administrator Lacks MFA Security',
  service: 'EntraID',
  severity: 'Critical',
  description: 'Privileged Microsoft Entra ID user account does not have Multi-Factor Authentication (MFA) enabled, exposing subscription control plane to credential stuffing attacks.',
  remediation: 'In Microsoft Entra Admin Center ➔ Protection ➔ Conditional Access, create policy enforcing MFA for all Global Administrators and Directory roles.',
  complianceMapping: {
    cisAzure: '1.1',
    nist: 'IA-2'
  },
  docLink: 'https://learn.microsoft.com/en-us/entra/identity/authentication/concept-mfa-howitworks',
  
  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || (resource.service !== 'EntraID' && resource.service !== 'IAM')) {
      return false;
    }
    const tags = resource.tags || {};
    const mfaActive = typeof tags.get === 'function' ? tags.get('MfaActive') : tags.MfaActive;

    return mfaActive === 'disabled' || resource.status === 'vulnerable';
  }
};
