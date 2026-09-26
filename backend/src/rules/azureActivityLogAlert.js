/**
 * CIS Microsoft Azure Foundations Benchmark 5.2 - Ensure Activity Log Alert Exists for Network Security Group and Administrative Changes
 */
module.exports = {
  id: 'CL-AZ-16',
  title: 'Azure Monitor Activity Log Alert Missing for Security & NSG Changes',
  service: 'Monitoring',
  severity: 'Medium',
  description: 'No Azure Monitor Activity Log Alert is configured to monitor administrative modifications, role assignment creations, or Network Security Group rule updates in real time.',
  remediation: 'In Azure Portal ➔ Monitor ➔ Alerts ➔ Alert rules, create an alert for administrative events on Network Security Groups and Policy changes.',
  complianceMapping: {
    cisAzure: '5.2',
    nist: 'SI-4'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-activity-log',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.service !== 'Monitoring') {
      return false;
    }
    const tags = resource.tags || {};
    const alertConfigured = typeof tags.get === 'function' ? tags.get('ActivityAlertConfigured') : tags.ActivityAlertConfigured;

    return alertConfigured === 'false' || alertConfigured === 'disabled';
  }
};
