const mongoose = require('mongoose');
const Payment = require('./src/models/Payment.model');
const Penalty = require('./src/models/Penalty.model');
const Member = require('./src/models/Member.model');
require('dotenv').config();

async function fixPenaltyStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peer2loan');
        console.log('Connected to MongoDB');

        // Find all confirmed/paid payments
        const confirmedPayments = await Payment.find({
            status: { $in: ['confirmed', 'paid', 'verified'] }
        }).populate('member', 'user');

        console.log(`\nFound ${confirmedPayments.length} confirmed payments`);

        let totalPenaltiesFixed = 0;

        for (const payment of confirmedPayments) {
            // Find all unpaid penalties for this member in this group
            const unpaidPenalties = await Penalty.find({
                member: payment.member._id,
                group: payment.group,
                isPaid: false,
                isWaived: false
            });

            if (unpaidPenalties.length > 0) {
                console.log(`\nMember ${payment.member._id} (Payment ${payment._id}): Found ${unpaidPenalties.length} unpaid penalties`);

                // Mark all penalties as paid
                for (const penalty of unpaidPenalties) {
                    await penalty.markAsPaid();
                    console.log(`  - Marked penalty ${penalty._id} (${penalty.type}, ₹${penalty.amount}) as paid`);
                    totalPenaltiesFixed++;
                }
            }
        }

        console.log(`\n✅ Fixed ${totalPenaltiesFixed} penalties total`);

        // Summary of current state
        const allPenalties = await Penalty.find({});
        const paidPenalties = allPenalties.filter(p => p.isPaid);
        const unpaidPenalties = allPenalties.filter(p => !p.isPaid && !p.isWaived);

        console.log(`\nCurrent penalty status:`);
        console.log(`  Total penalties: ${allPenalties.length}`);
        console.log(`  Paid: ${paidPenalties.length}`);
        console.log(`  Unpaid: ${unpaidPenalties.length}`);
        console.log(`  Waived: ${allPenalties.filter(p => p.isWaived).length}`);

        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixPenaltyStatus();
