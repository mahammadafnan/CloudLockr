/**
 * CIS GCP Foundations Benchmark 6.1 - Ensure Cloud SQL Instances Do Not Have Public IP Addresses Enabled
 */
module.exports = {
  id: 'CL-GCP-20',
  title: 'GCP Cloud SQL Database Instance Exposed via Public IP',
  service: 'CloudSQL',
  severity: 'Critical',
  description: 'Cloud SQL database instance has a public IP address enabled, exposing database network ports to public internet threats rather than using Private IP and Authorized VPC Networks.',
  remediation: 'In GCP Console ➔ Cloud SQL ➔ Select Instance ➔ Connections ➔ Networking, uncheck "Public IP" and enable "Private IP" with VPC Peering.',
  complianceMapping: {
    cisGCP: '6.1',
    nist: 'SC-7'
  },
  docLink: 'https://cloud.google.com/sql/docs/mysql/configure-ip',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'CloudSQL') {
      return false;
    }
    const tags = resource.tags || {};
    const publicIp = typeof tags.get === 'function' ? tags.get('PublicIP') : tags.PublicIP;

    return publicIp === 'enabled' || publicIp === 'true' || resource.status === 'public';
  }
};
