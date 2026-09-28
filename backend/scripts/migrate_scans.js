const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/cloudlockr').then(async () => {
  const col = mongoose.connection.collection('scans');
  
  // Clean up any scan marked AWS or with 22-23 resources that has project- accountId
  await col.updateMany(
    { provider: 'AWS' },
    { $set: { accountId: '464433361537' } }
  );

  await col.updateMany(
    { resourcesScanned: { $in: [22, 23] } },
    { $set: { provider: 'AWS', accountId: '464433361537' } }
  );

  console.log('Cleaned up AWS accountId in MongoDB scans collection');
  process.exit(0);
});
