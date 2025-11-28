const mongoose = require('mongoose');
const Cycle = require('../src/models/Cycle.model');
const Payment = require('../src/models/Payment.model');
const Group = require('../src/models/Group.model');

mongoose.connect('mongodb://localhost:27017/peer2loan')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all active cycles
    const cycles = await Cycle.find({ status: 'active' }).populate('group');
    
    console.log(`Found ${cycles.length} active cycles`);
    
    for (const cycle of cycles) {
      console.log(`\nChecking Cycle ${cycle.cycleNumber} in group ${cycle.group.name}`);
      console.log(`  Total members: ${cycle.totalMembers}`);
      console.log(`  Paid count: ${cycle.paidCount}`);
      console.log(`  Pending count: ${cycle.pendingCount}`);
      console.log(`  Is ready for payout: ${cycle.isReadyForPayout}`);
      
      // Update payment counts
      await cycle.updatePaymentCounts();
      
      console.log(`  After update - Paid count: ${cycle.paidCount}`);
      
      // Check readiness (100% quorum by default)
      await cycle.checkPayoutReadiness(100);
      
      console.log(`  After readiness check: ${cycle.isReadyForPayout}`);
      
      if (cycle.isReadyForPayout) {
        console.log(`  ✅ Cycle ${cycle.cycleNumber} is READY for payout!`);
      } else {
        console.log(`  ⏳ Cycle ${cycle.cycleNumber} is NOT ready yet`);
      }
    }
    
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
