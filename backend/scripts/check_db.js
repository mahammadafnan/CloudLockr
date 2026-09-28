const mongoose = require('mongoose');
const Resource = require('../src/models/Resource');
const Scan = require('../src/models/Scan');

mongoose.connect('mongodb://127.0.0.1:27017/cloudlockr').then(async () => {
  const res = await Resource.find({}, 'cloudProvider accountId').lean();
  const summary = {};
  res.forEach(r => {
    const k = (r.cloudProvider || 'NULL') + ' | ' + (r.accountId || 'NULL');
    summary[k] = (summary[k] || 0) + 1;
  });
  console.log('RESOURCES SUMMARY:', summary);

  const scans = await Scan.find().sort({ startedAt: -1 }).limit(10).lean();
  console.log('SCANS SUMMARY:', scans.map(s => ({
    id: s._id.toString().slice(0, 8),
    accountId: s.accountId,
    resourcesScanned: s.resourcesScanned,
    startedAt: s.startedAt
  })));

  process.exit(0);
});
