import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env configuration
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Import models
import Beneficiary from './models/Beneficiary.js';
import Counsellor from './models/Counsellor.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rbhms';

async function testRegistration() {
  console.log('Connecting to database:', MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connection successful.');

    // 1. Clean up any existing test records to ensure clean run
    await Beneficiary.deleteMany({ 'personalInfo.fullName': 'Test Verification Beneficiary' });
    await Counsellor.deleteMany({ mobileNumber: '8888888888' });

    // 2. Register a mock Counsellor
    console.log('Registering test counsellor...');
    const counsellor = await Counsellor.create({
      fullName: 'Test Counsellor',
      mobileNumber: '8888888888',
      password: 'testPassword123',
      district: 'Hyderabad',
      status: 'Active'
    });
    console.log('Counsellor registered successfully with ID:', counsellor._id);

    // 3. Register a new Beneficiary profile (Module 2 fields only)
    console.log('Registering test beneficiary...');
    const beneficiary = new Beneficiary({
      assignedCounsellor: counsellor._id,
      personalInfo: {
        fullName: 'Test Verification Beneficiary',
        mobileNumber: '7777777777',
        emailId: 'test@verification.com',
        gender: 'Female',
        age: 32,
        district: 'Hyderabad',
        mandal: 'Kukatpally',
        village: 'Madhapur',
        address: '123 Test Street, Hyderabad',
        shgName: 'N/A',
        educationalQualification: 'Graduate',
        aadhaarNumber: '111122223333',
        panNumber: 'ABCDE1234F'
      }
    });

    await beneficiary.save();
    console.log('Beneficiary registered successfully!');
    console.log('Generated Beneficiary ID:', beneficiary.beneficiaryId);
    console.log('Timeline generated count:', beneficiary.timeline.length);
    console.log('First timeline event:', beneficiary.timeline[0].title, '-', beneficiary.timeline[0].description);

    // 4. Test duplicate checker validation
    console.log('Testing duplicate registration checks...');
    try {
      const duplicateBeneficiary = new Beneficiary({
        personalInfo: {
          fullName: 'Duplicate Beneficiary',
          mobileNumber: '7777777777', // Same mobile number!
          gender: 'Male',
          age: 28,
          district: 'Hyderabad',
          mandal: 'Kukatpally',
          village: 'Madhapur',
          address: '456 Test Street',
          educationalQualification: 'SSC'
        }
      });
      await duplicateBeneficiary.save();
      console.error('ERROR: Duplicate mobile registration succeeded. Unique index failed!');
    } catch (err) {
      console.log('SUCCESS: Duplicate mobile registration blocked. Error message:', err.message);
    }

    // 5. Clean up tests
    console.log('Cleaning up test documents from database...');
    await Beneficiary.deleteMany({ 'personalInfo.fullName': 'Test Verification Beneficiary' });
    await Counsellor.deleteMany({ mobileNumber: '8888888888' });
    console.log('Clean up complete.');

  } catch (error) {
    console.error('Test verification failed with error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

testRegistration();
