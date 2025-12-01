const mongoose = require('mongoose');
const Penalty = require('./src/models/Penalty.model');
const Payment = require('./src/models/Payment.model');
const Member = require('./src/models/Member.model');
require('dotenv').config();

async function checkUserPenalties() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peer2loan');
        console.log('Connected to MongoDB');

        const groupId = '692d68ff88356ffccfd9f900';

        // Get the logged-in user's member record (kathan)
        const member = await Member.findOne({
            group: groupId,
            user: '692d689c88356ffccfd9f8fa' // You might need to adjust this
        }).populate('user', 'name email');

        if (!member) {
            console.log('Member not found for this user');
            await mongoose.disconnect();
            return;
        }

        console.log('\n=== MEMBER INFO ===');
        console.log('Member:', member.user?.name);
        console.log('Member ID:', member._id);
        console.log('Total Penalties:', member.totalPenalties);

        // Check penalties
        const penalties = await Penalty.find({ member: member._id })
            .populate('cycle', 'cycleNumber')
            .sort({ createdAt: -1 });

        console.log('\n=== ALL PENALTIES ===');
        console.log(`Found ${penalties.length} penalties for this member`);
        penalties.forEach(p => {
            console.log(`- Cycle ${p.cycle?.cycleNumber}: ₹${p.amount}, Type: ${p.type}, Paid: ${p.isPaid}, Waived: ${p.isWaived}`);
        });

        // Check unpaid penalties
        const unpaidPenalties = penalties.filter(p => !p.isPaid && !p.isWaived);
        console.log(`\nUnpaid penalties: ${unpaidPenalties.length}`);
        const totalUnpaid = unpaidPenalties.reduce((sum, p) => sum + p.amount, 0);
        console.log(`Total unpaid amount: ₹${totalUnpaid}`);

        // Check current cycle payment
        const currentPayment = await Payment.findOne({
            member: member._id,
            group: groupId,
        }).sort({ createdAt: -1 }).populate('cycle', 'cycleNumber status');

        if (currentPayment) {
            console.log('\n=== CURRENT PAYMENT ===');
            console.log('Cycle:', currentPayment.cycle?.cycleNumber);
            console.log('Amount:', currentPayment.amount);
            console.log('Status:', currentPayment.status);
            console.log('Late Fee on Payment:', currentPayment.lateFee);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUserPenalties();
