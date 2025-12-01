const mongoose = require('mongoose');
const Penalty = require('./src/models/Penalty.model');
const Payment = require('./src/models/Payment.model');
const Group = require('./src/models/Group.model');
require('dotenv').config();

async function checkPenalties() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peer2loan');
    console.log('Connected to MongoDB');

    const groupId = '692d68ff88356ffccfd9f900';

    // Check penalties
    const penalties = await Penalty.find({ group: groupId })
      .populate('member', 'turnNumber')
      .populate('cycle', 'cycleNumber')
      .sort({ createdAt: -1 });

    console.log('\n=== PENALTIES ===');
    console.log(`Found ${penalties.length} penalties for this group`);
    penalties.forEach(p => {
      console.log(`- ${p.type}: ₹${p.amount}, Cycle ${p.cycle?.cycleNumber}, isPaid: ${p.isPaid}, isWaived: ${p.isWaived}`);
    });

    // Check late payments
    const latePayments = await Payment.find({
      group: groupId,
      $or: [{ isLate: true }, { status: 'late' }]
    })
      .populate('member', 'turnNumber')
      .populate('cycle', 'cycleNumber');

    console.log('\n=== LATE PAYMENTS ===');
    console.log(`Found ${latePayments.length} late payments`);
    latePayments.forEach(p => {
      console.log(`- Cycle ${p.cycle?.cycleNumber}, Member Turn ${p.member?.turnNumber}, Late Fee: ₹${p.lateFee || 0}, Status: ${p.status}`);
    });

    // Check group details
    const group = await Group.findById(groupId);
    console.log('\n=== GROUP DETAILS ===');
    console.log(`Late Fee Setting: ₹${group.penaltyRules.lateFee}`);
    console.log(`Grace Period: ${group.penaltyRules.gracePeriodDays} days`);
    console.log(`Total Penalties in Stats: ₹${group.stats.totalPenalties}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPenalties();
