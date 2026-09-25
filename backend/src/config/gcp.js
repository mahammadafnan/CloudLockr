const path = require('path');
const fs = require('fs');

const keyFilePath = path.join(__dirname, '../../config/gcp-key.json');
let gcpConfig = {
  projectId: 'project-25a7942f-6ee6-4832-a57',
  clientEmail: 'cloudlockr-scanner@project-25a7942f-6ee6-4832-a57.iam.gserviceaccount.com',
  keyFilePath,
  isConfigured: false
};

if (fs.existsSync(keyFilePath)) {
  try {
    const rawData = fs.readFileSync(keyFilePath, 'utf8');
    const keyData = JSON.parse(rawData);
    gcpConfig.projectId = keyData.project_id || gcpConfig.projectId;
    gcpConfig.clientEmail = keyData.client_email || gcpConfig.clientEmail;
    gcpConfig.isConfigured = true;
    console.log(`[GCP Config] Verified Service Account Key for Project: ${gcpConfig.projectId}`);
  } catch (err) {
    console.error('[GCP Config] Error parsing gcp-key.json:', err.message);
  }
}

module.exports = gcpConfig;
