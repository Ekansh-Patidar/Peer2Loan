const mongoose = require('mongoose');
const Payment = require('../src/models/Payment.model');
const Member = require('../src/models/Member.model');
const Group = require('../src/models/Group.model');

mongoose.connect('mongodb://localhost:27017/peer2loan')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Fix payments with amount close to 5000 but not exactly 5000
    const payments = await Payment.find({
      amount: { $gte: 4999, $lt: 5000 }
    });
    
    console.log('Found', payments.length, 'payments to fix');
    
    for (const payment of payments) {
      console.log('Fixing payment:', payment._id, 'from', payment.amount, 'to 5000');
      payment.amount = 5000;
      await payment.save();
    }
    
    // Fix members with totalContributed close to multiples of 5000
    const members = await Member.find({
      totalContributed: { $gt: 0 }
    });
    
    console.log('Checking', members.length, 'members for rounding issues');
    
    for (const member of members) {
      const rounded = Math.round(member.totalContributed);
      if (Math.abs(member.totalContributed - rounded) > 0.01) {
        console.log('Fixing member:', member._id, 'totalContributed from', member.totalContributed, 'to', rounded);
        member.totalContributed = rounded;
        await member.save();
      }
    }
    
    // Fix groups with stats.totalCollected rounding issues
    const groups = await Group.find({
      'stats.totalCollected': { $gt: 0 }
    });
    
    console.log('Checking', groups.length, 'groups for rounding issues');
    
    for (const group of groups) {
      const rounded = Math.round(group.stats.totalCollected);
      if (Math.abs(group.stats.totalCollected - rounded) > 0.01) {
        console.log('Fixing group:', group._id, 'totalCollected from', group.stats.totalCollected, 'to', rounded);
        group.stats.totalCollected = rounded;
        await group.save();
      }
    }
    
    console.log('Done! Fixed all amounts');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
