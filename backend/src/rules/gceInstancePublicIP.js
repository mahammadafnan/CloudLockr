/**
 * CIS GCP Foundations Benchmark 3.8 - Ensure Compute Engine Instances Do Not Have Public IP Addresses Attached
 */
module.exports = {
  id: 'CL-GCP-12',
  title: 'GCE Compute Instance Configured with Direct Public IP Address',
  service: 'GCE',
  severity: 'High',
  description: 'Compute Engine instance is assigned a public External IP address directly, exposing it to direct internet threats rather than routing via Cloud NAT or Load Balancer.',
  remediation: 'In GCP Console ➔ Compute Engine ➔ VM instances ➔ Edit Network Interface, set External IPv4 address to "None" and route outbound traffic through Cloud NAT.',
  complianceMapping: {
    cisGCP: '3.8',
    nist: 'SC-7'
  },
  docLink: 'https://cloud.google.com/compute/docs/ip-addresses',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'GCE' || resource.type !== 'Instance') {
      return false;
    }
    const tags = resource.tags || {};
    const publicIp = typeof tags.get === 'function' ? tags.get('PublicIP') : tags.PublicIP;

    return Boolean(publicIp && publicIp !== 'none' && publicIp !== 'null' && publicIp !== 'undefined');
  }
};
