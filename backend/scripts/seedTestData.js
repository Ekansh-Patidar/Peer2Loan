/**
 * Comprehensive Seed Test Data Script
 * Creates test data for ALL functionality testing:
 * - Users (admin, regular members)
 * - Groups (active, pending, completed)
 * - Members with different turn numbers
 * - Cycles (active, pending, completed)
 * - Payments (pending, paid, under_review, rejected, late)
 * - Payouts (pending_approval, approved, completed)
 * - Penalties (for late payments)
 * - Notifications
 * - Audit Logs
 * 
 * Run: node scripts/seedTestData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../src/models/User.model');
const Group = require('../src/models/Group.model');
const Member = require('../src/models/Member.model');
const Cycle = require('../src/models/Cycle.model');
const Payment = require('../src/models/Payment.model');
const Payout = require('../src/models/Payout.model');
const Penalty = require('../src/models/Penalty.model');
const Notification = require('../src/models/Notification.model');
const AuditLog = require('../src/models/AuditLog.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/peer2loan';

// Test Users Data - Various roles
const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@peer2loan.com',
    password: 'password123',
    phone: '9876543210',
    role: 'admin',
  },
  {
    name: 'John Doe',
    email: 'john@peer2loan.com',
    password: 'password123',
    phone: '9876543211',
  },
  {
    name: 'Jane Smith',
    email: 'jane@peer2loan.com',
    password: 'password123',
    phone: '9876543212',
  },
  {
    name: 'Bob Wilson',
    email: 'bob@peer2loan.com',
    password: 'password123',
    phone: '9876543213',
  },
  {
    name: 'Alice Brown',
    email: 'alice@peer2loan.com',
    password: 'password123',
    phone: '9876543214',
  },
  {
    name: 'Charlie Davis',
    email: 'charlie@peer2loan.com',
    password: 'password123',
    phone: '9876543215',
  },
  {
    name: 'Diana Evans',
    email: 'diana@peer2loan.com',
    password: 'password123',
    phone: '9876543216',
  },
  {
    name: 'Edward Frank',
    email: 'edward@peer2loan.com',
    password: 'password123',
    phone: '9876543217',
  },
];

async function seedDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear ALL existing data
    console.log('🧹 Clearing existing data...');
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    await Penalty.deleteMany({});
    await Payment.deleteMany({});
    await Payout.deleteMany({});
    await Cycle.deleteMany({});
    await Member.deleteMany({});
    await Group.deleteMany({});
    await User.deleteMany({});
    console.log('  ✓ All collections cleared');

    // ========== CREATE USERS ==========
    console.log('\n👥 Creating test users...');
    const createdUsers = [];
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        isVerified: true,
      });
      console.log(`  ✓ Created: ${user.name} (${user.email})`);
      createdUsers.push(user);
    }

    const [adminUser, john, jane, bob, alice, charlie, diana, edward] = createdUsers;

    // ========== CREATE GROUPS ==========
    console.log('\n📁 Creating test groups...');
    
    // Group 1: Active group with active cycle (for payment testing)
    const group1 = await Group.create({
      name: 'Family Savings Pool',
      description: 'Monthly savings group for family members - ACTIVE with pending payments',
      monthlyContribution: 5000,
      duration: 12,
      startDate: new Date(),
      organizer: adminUser._id,
      status: 'active',
      memberCount: 5,
      currentCycle: 1,
    });
    console.log(`  ✓ Created: ${group1.name} (active)`);

    // Group 2: Active group ready for payout
    const group2 = await Group.create({
      name: 'Office Chit Fund',
      description: 'Office colleagues savings - Ready for payout processing',
      monthlyContribution: 10000,
      duration: 10,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 1 month ago
      organizer: adminUser._id,
      status: 'active',
      memberCount: 4,
      currentCycle: 1,
    });
    console.log(`  ✓ Created: ${group2.name} (active - ready for payout)`);

    // Group 3: Group with completed cycle and pending approval payout
    const group3 = await Group.create({
      name: 'Friends Circle',
      description: 'Friends group - Has payout pending approval',
      monthlyContribution: 3000,
      duration: 6,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Started 2 months ago
      organizer: adminUser._id,
      status: 'active',
      memberCount: 4,
      currentCycle: 2,
    });
    console.log(`  ✓ Created: ${group3.name} (active - payout pending approval)`);

    // Group 4: Group with approved payout ready to complete
    const group4 = await Group.create({
      name: 'Neighbors Fund',
      description: 'Neighborhood savings - Approved payout ready to complete',
      monthlyContribution: 2000,
      duration: 8,
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      organizer: adminUser._id,
      status: 'active',
      memberCount: 4,
      currentCycle: 3,
    });
    console.log(`  ✓ Created: ${group4.name} (active - approved payout)`);

    // Group 5: Draft group (not yet started)
    const group5 = await Group.create({
      name: 'New Year Savings',
      description: 'Starting next month - Draft group',
      monthlyContribution: 8000,
      duration: 12,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Starts next month
      organizer: john._id, // John is organizer
      status: 'draft',
      memberCount: 3,
      currentCycle: 0,
    });
    console.log(`  ✓ Created: ${group5.name} (draft)`);

    const allGroups = [group1, group2, group3, group4, group5];

    // ========== CREATE MEMBERS ==========
    console.log('\n👤 Adding members to groups...');
    
    // Group 1 members (5 members)
    const g1Members = [adminUser, john, jane, bob, alice];
    const group1Members = [];
    for (let i = 0; i < g1Members.length; i++) {
      const member = await Member.create({
        user: g1Members[i]._id,
        group: group1._id,
        turnNumber: i + 1,
        status: 'active',
        isOrganizer: g1Members[i]._id.equals(adminUser._id),
        totalContributed: 0,
        payoutAmount: 0,
        performanceScore: 100,
      });
      group1Members.push(member);
    }
    console.log(`  ✓ Added 5 members to ${group1.name}`);

    // Group 2 members (4 members - all paid)
    const g2Members = [adminUser, charlie, diana, edward];
    const group2Members = [];
    for (let i = 0; i < g2Members.length; i++) {
      const member = await Member.create({
        user: g2Members[i]._id,
        group: group2._id,
        turnNumber: i + 1,
        status: 'active',
        isOrganizer: g2Members[i]._id.equals(adminUser._id),
        totalContributed: group2.monthlyContribution,
        payoutAmount: 0,
        performanceScore: 100,
      });
      group2Members.push(member);
    }
    console.log(`  ✓ Added 4 members to ${group2.name}`);

    // Group 3 members
    const g3Members = [adminUser, john, jane, bob];
    const group3Members = [];
    for (let i = 0; i < g3Members.length; i++) {
      const member = await Member.create({
        user: g3Members[i]._id,
        group: group3._id,
        turnNumber: i + 1,
        status: 'active',
        isOrganizer: g3Members[i]._id.equals(adminUser._id),
        totalContributed: group3.monthlyContribution * 2,
        payoutAmount: i === 0 ? group3.monthlyContribution * 4 : 0,
        performanceScore: 100,
      });
      group3Members.push(member);
    }
    console.log(`  ✓ Added 4 members to ${group3.name}`);

    // Group 4 members
    const g4Members = [adminUser, alice, charlie, diana];
    const group4Members = [];
    for (let i = 0; i < g4Members.length; i++) {
      const member = await Member.create({
        user: g4Members[i]._id,
        group: group4._id,
        turnNumber: i + 1,
        status: 'active',
        isOrganizer: g4Members[i]._id.equals(adminUser._id),
        totalContributed: group4.monthlyContribution * 3,
        payoutAmount: i < 2 ? group4.monthlyContribution * 4 : 0,
        performanceScore: i === 3 ? 85 : 100, // Diana has lower score (late payment)
      });
      group4Members.push(member);
    }
    console.log(`  ✓ Added 4 members to ${group4.name}`);

    // Group 5 members (draft group)
    const g5Members = [john, jane, bob];
    for (let i = 0; i < g5Members.length; i++) {
      await Member.create({
        user: g5Members[i]._id,
        group: group5._id,
        turnNumber: i + 1,
        status: 'active',
        isOrganizer: g5Members[i]._id.equals(john._id),
        totalContributed: 0,
        payoutAmount: 0,
        performanceScore: 100,
      });
    }
    console.log(`  ✓ Added 3 members to ${group5.name}`);

    // ========== CREATE CYCLES ==========
    console.log('\n🔄 Creating cycles...');

    // Group 1 Cycle 1 - Active with mixed payment statuses
    const g1c1 = await Cycle.create({
      group: group1._id,
      cycleNumber: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      beneficiary: group1Members[0]._id, // Admin is beneficiary
      turnNumber: 1,
      status: 'active',
      expectedAmount: group1.monthlyContribution * 5,
      collectedAmount: group1.monthlyContribution * 2, // 2 paid
      totalMembers: 5,
      paidCount: 2,
      pendingCount: 2,
      lateCount: 1,
      isPayoutCompleted: false,
      isReadyForPayout: false,
    });
    console.log(`  ✓ Group 1 Cycle 1 (active - mixed payments)`);

    // Group 2 Cycle 1 - All paid, ready for payout
    const g2c1 = await Cycle.create({
      group: group2._id,
      cycleNumber: 1,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      beneficiary: group2Members[0]._id,
      turnNumber: 1,
      status: 'active',
      expectedAmount: group2.monthlyContribution * 4,
      collectedAmount: group2.monthlyContribution * 4, // All paid
      totalMembers: 4,
      paidCount: 4,
      pendingCount: 0,
      lateCount: 0,
      isPayoutCompleted: false,
      isReadyForPayout: true,
    });
    console.log(`  ✓ Group 2 Cycle 1 (active - all paid, ready for payout)`);

    // Group 3 Cycles - Cycle 1 completed, Cycle 2 active with pending approval payout
    const g3c1 = await Cycle.create({
      group: group3._id,
      cycleNumber: 1,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      beneficiary: group3Members[0]._id,
      turnNumber: 1,
      status: 'completed',
      expectedAmount: group3.monthlyContribution * 4,
      collectedAmount: group3.monthlyContribution * 4,
      totalMembers: 4,
      paidCount: 4,
      pendingCount: 0,
      lateCount: 0,
      isPayoutCompleted: true,
      isReadyForPayout: false,
    });

    const g3c2 = await Cycle.create({
      group: group3._id,
      cycleNumber: 2,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      beneficiary: group3Members[1]._id, // John is beneficiary
      turnNumber: 2,
      status: 'active',
      expectedAmount: group3.monthlyContribution * 4,
      collectedAmount: group3.monthlyContribution * 4,
      totalMembers: 4,
      paidCount: 4,
      pendingCount: 0,
      lateCount: 0,
      isPayoutCompleted: false,
      isReadyForPayout: true,
    });
    console.log(`  ✓ Group 3 Cycles 1-2 (completed + active with pending payout)`);

    // Group 4 Cycles - Multiple completed, one with approved payout
    const g4c1 = await Cycle.create({
      group: group4._id,
      cycleNumber: 1,
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      beneficiary: group4Members[0]._id,
      turnNumber: 1,
      status: 'completed',
      expectedAmount: group4.monthlyContribution * 4,
      collectedAmount: group4.monthlyContribution * 4,
      totalMembers: 4,
      paidCount: 4,
      pendingCount: 0,
      lateCount: 0,
      isPayoutCompleted: true,
    });

    const g4c2 = await Cycle.create({
      group: group4._id,
      cycleNumber: 2,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      beneficiary: group4Members[1]._id, // Alice
      turnNumber: 2,
      status: 'completed',
      expectedAmount: group4.monthlyContribution * 4,
      collectedAmount: group4.monthlyContribution * 4,
      totalMembers: 4,
      paidCount: 4,
      pendingCount: 0,
      lateCount: 0,
      isPayoutCompleted: true,
    });

    const g4c3 = await Cycle.create({
      group: group4._id,
      cycleNumber: 3,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      beneficiary: group4Members[2]._id, // Charlie
      turnNumber: 3,
      status: 'active',
      expectedAmount: group4.monthlyContribution * 4,
      collectedAmount: group4.monthlyContribution * 4,
      totalMembers: 4,
      paidCount: 4,
      pendingCount: 0,
      lateCount: 0,
      isPayoutCompleted: false,
      isReadyForPayout: true,
    });
    console.log(`  ✓ Group 4 Cycles 1-3 (2 completed + 1 active with approved payout)`);

    // ========== CREATE PAYMENTS ==========
    console.log('\n💳 Creating payments...');

    // Group 1 Payments - Mixed statuses for testing
    // Member 0 (Admin) - Paid
    await Payment.create({
      group: group1._id,
      member: group1Members[0]._id,
      cycle: g1c1._id,
      cycleNumber: 1,
      amount: group1.monthlyContribution,
      status: 'paid',
      type: 'contribution',
      dueDate: g1c1.endDate,
      paidAt: new Date(),
      paymentMode: 'upi',
      transactionId: 'pay_demo_001',
    });

    // Member 1 (John) - Paid
    await Payment.create({
      group: group1._id,
      member: group1Members[1]._id,
      cycle: g1c1._id,
      cycleNumber: 1,
      amount: group1.monthlyContribution,
      status: 'paid',
      type: 'contribution',
      dueDate: g1c1.endDate,
      paidAt: new Date(),
      paymentMode: 'card',
      transactionId: 'pay_demo_002',
    });

    // Member 2 (Jane) - Pending (can test Pay Now)
    await Payment.create({
      group: group1._id,
      member: group1Members[2]._id,
      cycle: g1c1._id,
      cycleNumber: 1,
      amount: group1.monthlyContribution,
      status: 'pending',
      type: 'contribution',
      dueDate: g1c1.endDate,
    });

    // Member 3 (Bob) - Under Review (submitted, awaiting approval)
    await Payment.create({
      group: group1._id,
      member: group1Members[3]._id,
      cycle: g1c1._id,
      cycleNumber: 1,
      amount: group1.monthlyContribution,
      status: 'under_review',
      type: 'contribution',
      dueDate: g1c1.endDate,
      paymentMode: 'bank_transfer',
      proofUrl: 'https://example.com/proof.jpg',
      submittedAt: new Date(),
    });

    // Member 4 (Alice) - Late payment
    await Payment.create({
      group: group1._id,
      member: group1Members[4]._id,
      cycle: g1c1._id,
      cycleNumber: 1,
      amount: group1.monthlyContribution,
      status: 'late',
      type: 'contribution',
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Due 7 days ago
    });
    console.log(`  ✓ Group 1: 5 payments (2 paid, 1 pending, 1 under_review, 1 late)`);

    // Group 2 Payments - All paid
    for (let i = 0; i < group2Members.length; i++) {
      await Payment.create({
        group: group2._id,
        member: group2Members[i]._id,
        cycle: g2c1._id,
        cycleNumber: 1,
        amount: group2.monthlyContribution,
        status: 'paid',
        type: 'contribution',
        dueDate: g2c1.endDate,
        paidAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        paymentMode: i % 2 === 0 ? 'upi' : 'netbanking',
        transactionId: `pay_g2_${i + 1}`,
      });
    }
    console.log(`  ✓ Group 2: 4 payments (all paid)`);

    // Group 3 Payments - Cycle 1 (completed) and Cycle 2 (all paid)
    for (let i = 0; i < group3Members.length; i++) {
      // Cycle 1 payments
      await Payment.create({
        group: group3._id,
        member: group3Members[i]._id,
        cycle: g3c1._id,
        cycleNumber: 1,
        amount: group3.monthlyContribution,
        status: 'paid',
        type: 'contribution',
        dueDate: g3c1.endDate,
        paidAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        paymentMode: 'upi',
        transactionId: `pay_g3c1_${i + 1}`,
      });
      // Cycle 2 payments
      await Payment.create({
        group: group3._id,
        member: group3Members[i]._id,
        cycle: g3c2._id,
        cycleNumber: 2,
        amount: group3.monthlyContribution,
        status: 'paid',
        type: 'contribution',
        dueDate: g3c2.endDate,
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        paymentMode: 'upi',
        transactionId: `pay_g3c2_${i + 1}`,
      });
    }
    console.log(`  ✓ Group 3: 8 payments (all paid for 2 cycles)`);

    // Group 4 Payments - All cycles paid
    for (const cycle of [g4c1, g4c2, g4c3]) {
      for (let i = 0; i < group4Members.length; i++) {
        await Payment.create({
          group: group4._id,
          member: group4Members[i]._id,
          cycle: cycle._id,
          cycleNumber: cycle.cycleNumber,
          amount: group4.monthlyContribution,
          status: 'paid',
          type: 'contribution',
          dueDate: cycle.endDate,
          paidAt: new Date(cycle.startDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          paymentMode: 'upi',
          transactionId: `pay_g4c${cycle.cycleNumber}_${i + 1}`,
        });
      }
    }
    console.log(`  ✓ Group 4: 12 payments (all paid for 3 cycles)`);


    // ========== CREATE PAYOUTS ==========
    console.log('\n💰 Creating payouts...');

    // Group 3 Cycle 1 - Completed payout
    await Payout.create({
      group: group3._id,
      cycle: g3c1._id,
      beneficiary: group3Members[0]._id, // Admin
      amount: group3.monthlyContribution * 4,
      status: 'completed',
      initiatedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
      scheduledDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      paymentMode: 'bank_transfer',
      transactionId: 'payout_g3c1_001',
      proofUrl: 'https://example.com/payout_proof.jpg',
    });
    console.log(`  ✓ Group 3 Cycle 1: Completed payout (₹${group3.monthlyContribution * 4})`);

    // Group 3 Cycle 2 - Pending approval payout (beneficiary needs to approve)
    await Payout.create({
      group: group3._id,
      cycle: g3c2._id,
      beneficiary: group3Members[1]._id, // John is beneficiary
      amount: group3.monthlyContribution * 4,
      status: 'pending_approval',
      initiatedAt: new Date(),
      scheduledDate: new Date(),
    });
    console.log(`  ✓ Group 3 Cycle 2: Pending approval payout (₹${group3.monthlyContribution * 4}) - John needs to approve`);

    // Group 4 Cycle 1 - Completed payout
    await Payout.create({
      group: group4._id,
      cycle: g4c1._id,
      beneficiary: group4Members[0]._id, // Admin
      amount: group4.monthlyContribution * 4,
      status: 'completed',
      initiatedAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 57 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000),
      scheduledDate: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000),
      paymentMode: 'upi',
      transactionId: 'payout_g4c1_001',
    });

    // Group 4 Cycle 2 - Completed payout
    await Payout.create({
      group: group4._id,
      cycle: g4c2._id,
      beneficiary: group4Members[1]._id, // Alice
      amount: group4.monthlyContribution * 4,
      status: 'completed',
      initiatedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
      scheduledDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      paymentMode: 'bank_transfer',
      transactionId: 'payout_g4c2_001',
    });

    // Group 4 Cycle 3 - Approved payout (ready to complete via Razorpay)
    await Payout.create({
      group: group4._id,
      cycle: g4c3._id,
      beneficiary: group4Members[2]._id, // Charlie
      amount: group4.monthlyContribution * 4,
      status: 'approved',
      initiatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      scheduledDate: new Date(),
    });
    console.log(`  ✓ Group 4: 3 payouts (2 completed, 1 approved - ready for Razorpay)`);

    // ========== CREATE PENALTIES ==========
    console.log('\n⚠️ Creating penalties...');

    // Penalty for Alice's late payment in Group 1
    await Penalty.create({
      group: group1._id,
      member: group1Members[4]._id, // Alice
      cycle: g1c1._id,
      amount: 500, // 10% penalty
      reason: 'Late payment - 7 days overdue',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });
    console.log(`  ✓ Penalty for Alice: ₹500 (late payment)`);

    // Paid penalty for Diana in Group 4 (historical)
    await Penalty.create({
      group: group4._id,
      member: group4Members[3]._id, // Diana
      cycle: g4c2._id,
      amount: 200,
      reason: 'Late payment - 3 days overdue',
      status: 'paid',
      dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    });
    console.log(`  ✓ Penalty for Diana: ₹200 (paid)`);

    // ========== CREATE NOTIFICATIONS ==========
    console.log('\n🔔 Creating notifications...');

    // Notification for John - Payout pending approval
    await Notification.create({
      user: john._id,
      type: 'payout_pending',
      title: 'Payout Awaiting Your Approval',
      message: `You have a payout of ₹${group3.monthlyContribution * 4} from Friends Circle awaiting your approval.`,
      isRead: false,
      createdAt: new Date(),
      data: { groupId: group3._id, cycleId: g3c2._id },
    });

    // Notification for Alice - Late payment reminder
    await Notification.create({
      user: alice._id,
      type: 'payment_reminder',
      title: 'Payment Overdue',
      message: `Your payment of ₹${group1.monthlyContribution} for Family Savings Pool is overdue. Please pay immediately to avoid additional penalties.`,
      isRead: false,
      createdAt: new Date(),
      data: { groupId: group1._id, cycleId: g1c1._id },
    });

    // Notification for Admin - Payment under review
    await Notification.create({
      user: adminUser._id,
      type: 'payment_review',
      title: 'Payment Needs Review',
      message: `Bob Wilson has submitted a payment of ₹${group1.monthlyContribution} for Family Savings Pool. Please review and approve.`,
      isRead: false,
      createdAt: new Date(),
      data: { groupId: group1._id, memberId: group1Members[3]._id },
    });

    // Notification for Charlie - Payout approved
    await Notification.create({
      user: charlie._id,
      type: 'payout_approved',
      title: 'Your Payout Has Been Approved',
      message: `Your payout of ₹${group4.monthlyContribution * 4} from Neighbors Fund has been approved and will be processed soon.`,
      isRead: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      data: { groupId: group4._id, cycleId: g4c3._id },
    });

    // Some read notifications
    await Notification.create({
      user: adminUser._id,
      type: 'group_created',
      title: 'Group Created Successfully',
      message: 'Family Savings Pool has been created successfully.',
      isRead: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });

    await Notification.create({
      user: jane._id,
      type: 'group_joined',
      title: 'Welcome to Family Savings Pool',
      message: 'You have successfully joined Family Savings Pool. Your turn number is 3.',
      isRead: true,
      createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    });
    console.log(`  ✓ Created 6 notifications`);

    // ========== CREATE AUDIT LOGS ==========
    console.log('\n📝 Creating audit logs...');

    const auditLogs = [
      { action: 'GROUP_CREATED', user: adminUser._id, details: { groupName: 'Family Savings Pool' } },
      { action: 'MEMBER_JOINED', user: john._id, details: { groupName: 'Family Savings Pool', turnNumber: 2 } },
      { action: 'PAYMENT_MADE', user: john._id, details: { amount: 5000, groupName: 'Family Savings Pool' } },
      { action: 'PAYOUT_INITIATED', user: adminUser._id, details: { amount: 12000, beneficiary: 'John Doe' } },
      { action: 'PAYOUT_APPROVED', user: john._id, details: { amount: 12000 } },
      { action: 'PAYOUT_COMPLETED', user: adminUser._id, details: { amount: 8000, beneficiary: 'Admin User' } },
      { action: 'PENALTY_APPLIED', user: adminUser._id, details: { amount: 500, member: 'Alice Brown', reason: 'Late payment' } },
    ];

    for (const log of auditLogs) {
      await AuditLog.create({
        ...log,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
      });
    }
    console.log(`  ✓ Created ${auditLogs.length} audit logs`);

    // ========== SUMMARY ==========
    console.log('\n' + '═'.repeat(60));
    console.log('✅ SEED DATA CREATED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    
    console.log('\n📋 TEST LOGIN CREDENTIALS:');
    console.log('─'.repeat(40));
    testUsers.forEach(user => {
      console.log(`  ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Password: ${user.password}`);
    });

    console.log('\n📊 DATA SUMMARY:');
    console.log('─'.repeat(40));
    console.log(`  Users: ${await User.countDocuments()}`);
    console.log(`  Groups: ${await Group.countDocuments()}`);
    console.log(`  Members: ${await Member.countDocuments()}`);
    console.log(`  Cycles: ${await Cycle.countDocuments()}`);
    console.log(`  Payments: ${await Payment.countDocuments()}`);
    console.log(`  Payouts: ${await Payout.countDocuments()}`);
    console.log(`  Penalties: ${await Penalty.countDocuments()}`);
    console.log(`  Notifications: ${await Notification.countDocuments()}`);
    console.log(`  Audit Logs: ${await AuditLog.countDocuments()}`);

    console.log('\n🧪 TEST SCENARIOS AVAILABLE:');
    console.log('─'.repeat(40));
    console.log('  1. PAYMENTS:');
    console.log('     - Login as jane@peer2loan.com → Pay pending payment via Razorpay/UPI');
    console.log('     - Login as admin@peer2loan.com → Review Bob\'s payment (under_review)');
    console.log('     - Login as alice@peer2loan.com → See late payment with penalty');
    console.log('');
    console.log('  2. PAYOUTS:');
    console.log('     - Login as john@peer2loan.com → Approve pending payout (Friends Circle)');
    console.log('     - Login as admin@peer2loan.com → Complete approved payout via Razorpay');
    console.log('     - Login as admin@peer2loan.com → Process new payout (Office Chit Fund)');
    console.log('');
    console.log('  3. GROUPS:');
    console.log('     - View active groups with different statuses');
    console.log('     - View draft group (New Year Savings)');
    console.log('     - Check group ledger and member details');
    console.log('');
    console.log('  4. NOTIFICATIONS:');
    console.log('     - Check unread notifications for various users');
    console.log('');
    console.log('  5. PENALTIES:');
    console.log('     - View pending penalty (Alice in Family Savings Pool)');
    console.log('     - View paid penalty history (Diana in Neighbors Fund)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
