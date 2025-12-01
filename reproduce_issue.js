
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Payment = require('./backend/src/models/Payment.model');
const Group = require('./backend/src/models/Group.model');
const Cycle = require('./backend/src/models/Cycle.model');
const Member = require('./backend/src/models/Member.model');
const paymentService = require('./backend/src/services/payment.service');

async function run() {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    try {
        // Create mock data
        const group = await Group.create({
            name: 'Test Group',
            organizer: new mongoose.Types.ObjectId(),
            monthlyContribution: 5000,
            memberCount: 5,
            duration: 5,
            startDate: new Date(),
            turnOrderType: 'fixed',
            stats: { totalCollected: 0 }
        });

        const cycle = await Cycle.create({
            group: group._id,
            cycleNumber: 1,
            startDate: new Date(),
            endDate: new Date(),
            status: 'active'
        });

        const member = await Member.create({
            user: new mongoose.Types.ObjectId(),
            group: group._id,
            turnNumber: 1,
            status: 'active'
        });

        // Test payment recording with string input
        const amountString = "5000";
        console.log('Recording payment with string input:', amountString);

        const payment1 = await paymentService.recordPayment({
            groupId: group._id.toString(),
            cycleId: cycle._id.toString(),
            memberId: member._id.toString(),
            userId: member.user.toString(),
            amount: amountString,
            paymentMode: 'upi',
            transactionId: 'TXN123',
            paidAt: new Date()
        });

        console.log('Payment 1 recorded amount:', payment1.amount);

        if (payment1.amount !== 5000) {
            console.error('ERROR: Payment 1 amount mismatch!', payment1.amount);
        } else {
            console.log('SUCCESS: Payment 1 amount matches.');
        }

        // Test payment recording with dirty string input (simulating frontend issue if any)
        // Note: The service now has strict parsing, so it should handle this if we passed it through the controller logic
        // But here we are calling service directly. The service also has the fix.
        const amountDirty = "5000.00";
        console.log('Recording payment with dirty string input:', amountDirty);

        // Create a new cycle for second payment to avoid conflict
        const cycle2 = await Cycle.create({
            group: group._id,
            cycleNumber: 2,
            startDate: new Date(),
            endDate: new Date(),
            status: 'active'
        });

        const payment2 = await paymentService.recordPayment({
            groupId: group._id.toString(),
            cycleId: cycle2._id.toString(),
            memberId: member._id.toString(),
            userId: member.user.toString(),
            amount: amountDirty,
            paymentMode: 'upi',
            transactionId: 'TXN124',
            paidAt: new Date()
        });

        console.log('Payment 2 recorded amount:', payment2.amount);

        if (payment2.amount !== 5000) {
            console.error('ERROR: Payment 2 amount mismatch!', payment2.amount);
        } else {
            console.log('SUCCESS: Payment 2 amount matches.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        await mongoServer.stop();
    }
}

run();
