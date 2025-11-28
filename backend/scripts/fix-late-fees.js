const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('../src/models/Payment.model');
const Penalty = require('../src/models/Penalty.model');
const Member = require('../src/models/Member.model');
const Group = require('../src/models/Group.model');

const fixLateFees = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all payments
    const payments = await Payment.find({}).populate('group');
    
    console.log(`Found ${payments.length} payments to check`);
    
    let fixed = 0;
    
    for (const payment of payments) {
      if (!payment.paidAt || !payment.dueDate || !payment.group) {
        continue;
      }
      
      const gracePeriodDays = payment.group.penaltyRules?.gracePeriodDays || 0;
      const graceEndDate = new Date(payment.dueDate);
      graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays);
      
      const isActuallyLate = payment.paidAt > graceEndDate;
      const daysDiff = Math.floor((payment.paidAt - graceEndDate) / (1000 * 60 * 60 * 24));
      
      // If payment was marked as late but actually wasn't
      if (payment.isLate && !isActuallyLate) {
        console.log(`Fixing payment ${payment._id} - was marked late but paid on time`);
        console.log(`  Paid: ${payment.paidAt}, Due: ${payment.dueDate}, Grace End: ${graceEndDate}`);
        
        const oldLateFee = payment.lateFee || 0;
        
        // Update payment
        payment.isLate = false;
        payment.daysLate = 0;
        payment.lateFee = 0;
        await payment.save();
        
        // Remove penalty if exists
        const penalty = await Penalty.findOne({ payment: payment._id, type: 'late_fee' });
        if (penalty && !penalty.isPaid) {
          await Penalty.deleteOne({ _id: penalty._id });
          console.log(`  Removed penalty ${penalty._id}`);
        }
        
        // Update member stats
        if (oldLateFee > 0) {
          await Member.findByIdAndUpdate(payment.member, {
            $inc: { 
              totalPenalties: -oldLateFee,
              latePayments: -1
            }
          });
          console.log(`  Updated member stats - removed ${oldLateFee} penalty`);
        }
        
        // Update group stats
        if (oldLateFee > 0) {
          await Group.findByIdAndUpdate(payment.group._id, {
            $inc: { 'stats.totalPenalties': -oldLateFee }
          });
        }
        
        fixed++;
      }
      // If payment should be late but isn't marked
      else if (!payment.isLate && isActuallyLate && daysDiff > 0) {
        console.log(`Payment ${payment._id} should be marked as late`);
        payment.isLate = true;
        payment.daysLate = daysDiff;
        await payment.save();
        fixed++;
      }
    }
    
    console.log(`\nFixed ${fixed} payments`);
    
    // Recalculate all member performance scores
    const members = await Member.find({});
    for (const member of members) {
      member.calculatePerformanceScore();
      await member.save();
    }
    console.log(`Recalculated performance scores for ${members.length} members`);
    
    await mongoose.disconnect();
    console.log('Done!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixLateFees();
