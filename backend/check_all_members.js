const mongoose = require('mongoose');
const Member = require('./src/models/Member.model');
const User = require('./src/models/User.model');
const Penalty = require('./src/models/Penalty.model');
const Payment = require('./src/models/Payment.model');
require('dotenv').config();

async function checkAllMembers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peer2loan');
        console.log('Connected to MongoDB');

        const groupId = '692d68ff88356ffccfd9f900';

        // Get all members
        const members = await Member.find({ group: groupId })
            .populate('user', 'name email');

        console.log('\n=== ALL MEMBERS ===');
        for (const member of members) {
            console.log(`\n${member.user?.name} (${member.user?.email})`);
            console.log(`  Member ID: ${member._id}`);
            console.log(`  User ID: ${member.user?._id}`);
            console.log(`  Turn: ${member.turnNumber}`);
            console.log(`  Total Penalties: ₹${member.totalPenalties}`);

            // Check unpaid penalties
            const unpaidPenalties = await Penalty.find({
                member: member._id,
                isPaid: false,
                isWaived: false,
            });

            console.log(`  Unpaid Penalties: ${unpaidPenalties.length} (₹${unpaidPenalties.reduce((s, p) => s + p.amount, 0)})`);

            // Check latest payment
            const latestPayment = await Payment.findOne({
                member: member._id,
            }).sort({ createdAt: -1 }).populate('cycle', 'cycleNumber');

            if (latestPayment) {
                console.log(`  Latest Payment: Cycle ${latestPayment.cycle?.cycleNumber}, Amount: ₹${latestPayment.amount}, Status: ${latestPayment.status}`);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAllMembers();
