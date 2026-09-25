/**
 * CIS GCP Foundations Benchmark 4.8 - Ensure Shielded VM is Enabled on Compute Engine Instances
 */
module.exports = {
  id: 'CL-GCP-13',
  title: 'GCE Compute Instance Shielded VM Features Disabled',
  service: 'GCE',
  severity: 'Medium',
  description: 'Compute Engine instance does not have Shielded VM features (vTPM, Secure Boot, Integrity Monitoring) enabled, leaving it susceptible to rootkit or boot-level malware.',
  remediation: 'In GCP Console ➔ Compute Engine ➔ VM instances ➔ Stop VM ➔ Edit ➔ Enable "Shielded VM" (Secure Boot & vTPM) ➔ Start VM.',
  complianceMapping: {
    cisGCP: '4.8',
    nist: 'SI-7'
  },
  docLink: 'https://cloud.google.com/security/shielded-cloud/shielded-vm',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'GCE' || resource.type !== 'Instance') {
      return false;
    }
    const tags = resource.tags || {};
    const shielded = typeof tags.get === 'function' ? tags.get('ShieldedVM') : tags.ShieldedVM;

    return shielded === 'disabled' || shielded === 'false';
  }
};
