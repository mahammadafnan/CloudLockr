module.exports = {
  id: 'IAM-001',
  title: 'IAM User Has AdministratorAccess',
  description: 'IAM user has AdministratorAccess policy attached, granting unrestricted access (Action: *, Resource: *) to AWS services and resources.',
  severity: 'Critical',
  deduction: 20,
  category: 'IAM / Excessive Privileges',
  recommendation: 'Remove AdministratorAccess and grant only the least-privilege permissions required by the user.',
  complianceMapping: {
    cisAWS: '1.16',
    awsBestPractices: 'IAM-001',
    nist: 'PR.AC-6',
  },
  docLink: 'https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AdministratorAccess.html',

  /**
   * Check if the resource violates the policy
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    if (resource.service !== 'IAM' || resource.type !== 'User') {
      return false;
    }

    // 1. Direct tag check
    const hasAdminAccess = resource.tags?.get
      ? resource.tags.get('HasAdministratorAccess')
      : resource.tags?.HasAdministratorAccess;

    if (hasAdminAccess === 'true') {
      return true;
    }

    // 2. Attached policies check
    const attachedPolicies = resource.tags?.get
      ? resource.tags.get('AttachedPolicies')
      : resource.tags?.AttachedPolicies;

    if (attachedPolicies && typeof attachedPolicies === 'string') {
      const policiesLower = attachedPolicies.toLowerCase();
      if (
        policiesLower.includes('administratoraccess') ||
        policiesLower.includes('arn:aws:iam::aws:policy/administratoraccess')
      ) {
        return true;
      }
    }

    // 3. Fallback check for user name indicating test admin scenario or direct property
    const userPolicies = resource.policies || resource.configuration?.attachedPolicies || [];
    if (Array.isArray(userPolicies)) {
      return userPolicies.some((p) => {
        const name = typeof p === 'string' ? p : p.PolicyName || p.policyName || '';
        return name.toLowerCase().includes('administratoraccess');
      });
    }

    return false;
  },
};
