const mongoose = require('mongoose');
const Payment = require('../src/models/Payment.model');
const Member = require('../src/models/Member.model');
const Group = require('../src/models/Group.model');

mongoose.connect('mongodb://localhost:27017/peer2loan')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Recalculate group stats from actual payments
    const groups = await Group.find({});
    
    for (const group of groups) {
      console.log('\nProcessing group:', group.name);
      
      // Get all confirmed/paid payments for this group
      const payments = await Payment.find({
        group: group._id,
        status: { $in: ['paid', 'under_review', 'verified', 'confirmed'] }
      });
      
      const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
      console.log('  Payments count:', payments.length);
      console.log('  Current totalCollected:', group.stats.totalCollected);
      console.log('  Calculated totalCollected:', totalCollected);
      
      if (Math.abs(group.stats.totalCollected - totalCollected) > 0.01) {
        console.log('  Updating totalCollected to:', totalCollected);
        group.stats.totalCollected = totalCollected;
        await group.save();
      }
      
      // Recalculate member stats
      const members = await Member.find({ group: group._id });
      for (const member of members) {
        const memberPayments = await Payment.find({
          member: member._id,
          status: { $in: ['paid', 'under_review', 'verified', 'confirmed'] }
        });
        
        const totalContributed = memberPayments.reduce((sum, p) => sum + p.amount, 0);
        
        if (Math.abs(member.totalContributed - totalContributed) > 0.01) {
          console.log('  Member', member._id, 'totalContributed:', member.totalContributed, '→', totalContributed);
          member.totalContributed = totalContributed;
          await member.save();
        }
      }
    }
    
    console.log('\nDone! Recalculated all stats');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
