/**
 * Quick Seed Script - Creates essential test data
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User.model');
const Group = require('../src/models/Group.model');
const Member = require('../src/models/Member.model');
const Cycle = require('../src/models/Cycle.model');
const Payment = require('../src/models/Payment.model');
const Payout = require('../src/models/Payout.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/peer2loan';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear data
  await Payment.deleteMany({});
  await Payout.deleteMany({});
  await Cycle.deleteMany({});
  await Member.deleteMany({});
  await Group.deleteMany({});
  await User.deleteMany({});
  console.log('Cleared existing data');

  // Create users
  const hashedPwd = await bcrypt.hash('password123', 10);
  const users = await User.insertMany([
    { name: 'Admin User', email: 'admin@peer2loan.com', password: hashedPwd, phone: '9876543210', isVerified: true },
    { name: 'John Doe', email: 'john@peer2loan.com', password: hashedPwd, phone: '9876543211', isVerified: true },
    { name: 'Jane Smith', email: 'jane@peer2loan.com', password: hashedPwd, phone: '9876543212', isVerified: true },
    { name: 'Bob Wilson', email: 'bob@peer2loan.com', password: hashedPwd, phone: '9876543213', isVerified: true },
    { name: 'Alice Brown', email: 'alice@peer2loan.com', password: hashedPwd, phone: '9876543214', isVerified: true },
  ]);
  console.log('Created 5 users');

  const [admin, john, jane, bob, alice] = users;

  // Create Group 1 - Active with mixed payments
  const group1 = await Group.create({
    name: 'Family Savings Pool',
    description: 'Active group with pending payments for testing',
    monthlyContribution: 5000,
    duration: 5,
    startDate: new Date(),
    organizer: admin._id,
    status: 'active',
    memberCount: 5,
    currentCycle: 1,
  });

  // Create Group 2 - Ready for payout
  const group2 = await Group.create({
    name: 'Office Chit Fund',
    description: 'All paid - ready for payout processing',
    monthlyContribution: 10000,
    duration: 4,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    organizer: admin._id,
    status: 'active',
    memberCount: 4,
    currentCycle: 1,
  });
  console.log('Created 2 groups');

  // Create members for Group 1
  const g1Members = [];
  for (let i = 0; i < users.length; i++) {
    const m = await Member.create({
      user: users[i]._id,
      group: group1._id,
      turnNumber: i + 1,
      status: 'active',
      isOrganizer: i === 0,
      totalContributed: 0,
      performanceScore: 100,
    });
    g1Members.push(m);
  }

  // Create members for Group 2
  const g2Members = [];
  for (let i = 0; i < 4; i++) {
    const m = await Member.create({
      user: users[i]._id,
      group: group2._id,
      turnNumber: i + 1,
      status: 'active',
      isOrganizer: i === 0,
      totalContributed: 10000,
      performanceScore: 100,
    });
    g2Members.push(m);
  }
  console.log('Created members');

  // Create Cycle 1 for Group 1
  const cycle1 = await Cycle.create({
    group: group1._id,
    cycleNumber: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    beneficiary: g1Members[0]._id,
    turnNumber: 1,
    status: 'active',
    expectedAmount: 25000,
    collectedAmount: 10000,
    totalMembers: 5,
    paidCount: 2,
    pendingCount: 3,
  });

  // Create Cycle 1 for Group 2
  const cycle2 = await Cycle.create({
    group: group2._id,
    cycleNumber: 1,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    beneficiary: g2Members[0]._id,
    turnNumber: 1,
    status: 'active',
    expectedAmount: 40000,
    collectedAmount: 40000,
    totalMembers: 4,
    paidCount: 4,
    pendingCount: 0,
    isReadyForPayout: true,
  });
  console.log('Created cycles');

  // Group 1 Payments
  await Payment.insertMany([
    { group: group1._id, member: g1Members[0]._id, cycle: cycle1._id, cycleNumber: 1, amount: 5000, status: 'paid', type: 'contribution', dueDate: cycle1.endDate, paidAt: new Date(), paymentMode: 'upi' },
    { group: group1._id, member: g1Members[1]._id, cycle: cycle1._id, cycleNumber: 1, amount: 5000, status: 'paid', type: 'contribution', dueDate: cycle1.endDate, paidAt: new Date(), paymentMode: 'upi' },
    { group: group1._id, member: g1Members[2]._id, cycle: cycle1._id, cycleNumber: 1, amount: 5000, status: 'pending', type: 'contribution', dueDate: cycle1.endDate },
    { group: group1._id, member: g1Members[3]._id, cycle: cycle1._id, cycleNumber: 1, amount: 5000, status: 'under_review', type: 'contribution', dueDate: cycle1.endDate, paymentMode: 'bank_transfer' },
    { group: group1._id, member: g1Members[4]._id, cycle: cycle1._id, cycleNumber: 1, amount: 5000, status: 'pending', type: 'contribution', dueDate: cycle1.endDate },
  ]);

  // Group 2 Payments
  for (let i = 0; i < 4; i++) {
    await Payment.create({
      group: group2._id, member: g2Members[i]._id, cycle: cycle2._id, cycleNumber: 1,
      amount: 10000, status: 'paid', type: 'contribution', dueDate: cycle2.endDate,
      paidAt: new Date(), paymentMode: 'upi'
    });
  }
  console.log('Created payments');

  // Create approved payout
  await Payout.create({
    group: group2._id,
    cycle: cycle2._id,
    beneficiary: g2Members[0]._id,
    amount: 40000,
    status: 'approved',
    initiatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    approvedAt: new Date(),
    scheduledDate: new Date(),
  });
  console.log('Created payout');

  console.log('\n✅ SEED COMPLETE!');
  console.log('Users:', await User.countDocuments());
  console.log('Groups:', await Group.countDocuments());
  console.log('Payments:', await Payment.countDocuments());
  console.log('\nLogin: admin@peer2loan.com / password123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
