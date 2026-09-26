/**
 * Industry-Standard CSPM Security Posture & Compliance Calculator
 * 
 * Implements CIS Benchmark & CSPM severity-weighted risk density scoring:
 * - Security Score: Reflects overall infrastructure health based on severity-weighted
 *   penalty relative to the resource inventory.
 * - Compliance Rate: Measures the percentage of benchmark security rules/controls passed.
 */

/**
 * Calculate security posture metrics
 * 
 * @param {Object} params
 * @param {Array|Number} params.resources Total resource count or list of Resource documents
 * @param {Array|Object} params.findings Total active findings or array of Finding documents
 * @param {String} [params.provider='ALL'] Cloud provider scope (ALL, AWS, GCP, AZURE)
 * @returns {Object} { securityScore, complianceRate, findingsCount, totalResources, healthyCount, affectedCount }
 */
function calculateSecurityPosture({ resources = [], findings = [], provider = 'ALL' }) {
  const totalResources = Array.isArray(resources) ? resources.length : (Number(resources) || 0);

  let counts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0, total: 0 };
  let uniqueViolatedRules = new Set();
  let affectedResourceIds = new Set();

  if (Array.isArray(findings)) {
    for (const f of findings) {
      if (f.status === 'Active') {
        const sev = (f.severity || 'Medium').toLowerCase();
        if (counts[sev] !== undefined) counts[sev]++;
        counts.total++;
        if (f.title) uniqueViolatedRules.add(f.title);
        if (f.resourceId) {
          const id = typeof f.resourceId === 'object' ? f.resourceId._id : f.resourceId;
          if (id) affectedResourceIds.add(String(id));
        }
      }
    }
  } else if (findings && typeof findings === 'object') {
    counts.critical = Number(findings.critical) || 0;
    counts.high = Number(findings.high) || 0;
    counts.medium = Number(findings.medium) || 0;
    counts.low = Number(findings.low) || 0;
    counts.informational = Number(findings.informational) || 0;
    counts.total = counts.critical + counts.high + counts.medium + counts.low + counts.informational;
  }

  // Base rule counts per provider registry
  const providerUpper = (provider || 'ALL').toUpperCase();
  const benchmarkRulesCount = providerUpper === 'GCP' ? 20
    : providerUpper === 'AZURE' ? 16
    : providerUpper === 'AWS' ? 9
    : 45;

  if (totalResources === 0) {
    return {
      securityScore: 100,
      complianceRate: 100,
      healthyResourcesCount: 0,
      affectedResourcesCount: 0,
      totalResources: 0,
      findingsCount: counts
    };
  }

  // 1. Severity-Weighted Risk Penalty:
  // Critical: 1.0, High: 0.5, Medium: 0.2, Low: 0.05, Informational: 0
  const weightedPenalty =
    (counts.critical * 1.0) +
    (counts.high * 0.5) +
    (counts.medium * 0.2) +
    (counts.low * 0.05);

  // Normalized risk density across the resource base
  const riskDensity = weightedPenalty / totalResources;
  const rawScore = Math.max(0, Math.min(100, (1 - riskDensity) * 100));
  const securityScore = Math.round(rawScore * 10) / 10;

  // 2. CIS Control Compliance Rate
  const failedRulesCount = uniqueViolatedRules.size || Math.min(benchmarkRulesCount, counts.total);
  const passedRulesCount = Math.max(0, benchmarkRulesCount - failedRulesCount);
  const complianceRate = Math.round((passedRulesCount / benchmarkRulesCount) * 1000) / 10;

  const affectedCount = affectedResourceIds.size || Math.min(totalResources, counts.total);
  const healthyCount = Math.max(0, totalResources - affectedCount);

  return {
    securityScore,
    complianceRate,
    healthyResourcesCount: healthyCount,
    affectedResourcesCount: affectedCount,
    totalResources,
    findingsCount: counts,
    rulesEvaluated: benchmarkRulesCount,
    passedRules: passedRulesCount
  };
}

module.exports = { calculateSecurityPosture };
