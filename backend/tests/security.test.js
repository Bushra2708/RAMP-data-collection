import assert from 'assert';

const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🚀 Starting RBHMS Security, Role, and Validation Tests...\n');

  let adminToken = '';
  let counsellor1Token = '';
  let counsellor2Token = '';
  let beneficiaryId = '';

  // 1. Admin Login
  try {
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aleap.org', password: 'admin123' }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
    adminToken = data.token;
    console.log('✅ TEST PASS: Admin login successful.');
  } catch (err) {
    console.error('❌ TEST FAIL: Admin login failed:', err.message);
    process.exit(1);
  }

  // 2. Register Counsellor 1 (Admin Only)
  const counsellorMobile1 = '9999900001';
  try {
    const res = await fetch(`${API_BASE}/auth/counsellor/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        fullName: 'Test Counsellor One',
        mobileNumber: counsellorMobile1,
        password: 'password123',
        district: 'Hyderabad',
      }),
    });
    const data = await res.json();
    // Might return 400 if already exists, which is fine
    if (res.status === 201) {
      assert.strictEqual(data.success, true);
      console.log('✅ TEST PASS: Registered Counsellor 1.');
    } else {
      assert.strictEqual(res.status, 400);
      console.log('ℹ️ INFO: Counsellor 1 already registered.');
    }
  } catch (err) {
    console.error('❌ TEST FAIL: Counsellor 1 registration failed:', err.message);
    process.exit(1);
  }

  // 3. Register Counsellor 2 (Admin Only)
  const counsellorMobile2 = '9999900002';
  try {
    const res = await fetch(`${API_BASE}/auth/counsellor/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        fullName: 'Test Counsellor Two',
        mobileNumber: counsellorMobile2,
        password: 'password123',
        district: 'Warangal',
      }),
    });
    const data = await res.json();
    if (res.status === 201) {
      assert.strictEqual(data.success, true);
      console.log('✅ TEST PASS: Registered Counsellor 2.');
    } else {
      assert.strictEqual(res.status, 400);
      console.log('ℹ️ INFO: Counsellor 2 already registered.');
    }
  } catch (err) {
    console.error('❌ TEST FAIL: Counsellor 2 registration failed:', err.message);
    process.exit(1);
  }

  // 4. Log in as Counsellor 1 and Counsellor 2
  try {
    const res1 = await fetch(`${API_BASE}/auth/counsellor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: counsellorMobile1, password: 'password123' }),
    });
    const data1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    counsellor1Token = data1.token;

    const res2 = await fetch(`${API_BASE}/auth/counsellor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: counsellorMobile2, password: 'password123' }),
    });
    const data2 = await res2.json();
    assert.strictEqual(res2.status, 200);
    counsellor2Token = data2.token;

    console.log('✅ TEST PASS: Counsellors logged in successfully.');
  } catch (err) {
    console.error('❌ TEST FAIL: Counsellor login failed:', err.message);
    process.exit(1);
  }

  // 5. Security: Unauthorized route blocks
  try {
    const res = await fetch(`${API_BASE}/audit`, {
      method: 'GET',
    });
    assert.strictEqual(res.status, 401);
    console.log('✅ TEST PASS: Guest blocked from accessing audit logs.');
  } catch (err) {
    console.error('❌ TEST FAIL: Guest route guard failed:', err.message);
    process.exit(1);
  }

  // 6. Role Protection: Counsellor blocked from Admin route
  try {
    const res = await fetch(`${API_BASE}/audit`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${counsellor1Token}` },
    });
    assert.strictEqual(res.status, 403);
    console.log('✅ TEST PASS: Counsellor blocked from Admin audit logs route.');
  } catch (err) {
    console.error('❌ TEST FAIL: Admin route guard failed for Counsellor:', err.message);
    process.exit(1);
  }

  // 7. Success Admin Route Access
  try {
    const res = await fetch(`${API_BASE}/audit`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    console.log('✅ TEST PASS: Admin successfully fetched audit logs.');
  } catch (err) {
    console.error('❌ TEST FAIL: Admin blocked from audit logs:', err.message);
    process.exit(1);
  }

  // 8. Data Validation: Create Beneficiary & Prevent Duplicates
  const testMobile = '9876543210';
  const beneficiaryPayload = {
    personalInfo: {
      fullName: 'John Doe Security Test',
      mobileNumber: testMobile,
      district: 'Hyderabad',
      village: 'Test Village',
      gender: 'Male',
      socialCategory: 'General'
    }
  };

  try {
    // Attempt registration
    const res = await fetch(`${API_BASE}/beneficiary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${counsellor1Token}`,
      },
      body: JSON.stringify(beneficiaryPayload),
    });
    const data = await res.json();
    
    if (res.status === 201) {
      assert.strictEqual(data.success, true);
      beneficiaryId = data.beneficiary.id;
      console.log('✅ TEST PASS: Beneficiary registered successfully.');
    } else if (res.status === 400 && data.duplicateField === 'mobileNumber') {
      beneficiaryId = data.existingId;
      console.log('ℹ️ INFO: Beneficiary already registered.');
    } else {
      throw new Error(`Unexpected status code: ${res.status}`);
    }

    // Try registering duplicate mobile number
    const dupRes = await fetch(`${API_BASE}/beneficiary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${counsellor1Token}`,
      },
      body: JSON.stringify({
        personalInfo: {
          fullName: 'Duplicate Jane Doe',
          mobileNumber: testMobile,
          district: 'Hyderabad'
        }
      }),
    });
    assert.strictEqual(dupRes.status, 400);
    const dupData = await dupRes.json();
    assert.strictEqual(dupData.success, false);
    assert.strictEqual(dupData.duplicateField, 'mobileNumber');
    console.log('✅ TEST PASS: Duplicate registration blocked with 400 Bad Request.');
  } catch (err) {
    console.error('❌ TEST FAIL: Duplicate registration test failed:', err.message);
    process.exit(1);
  }

  // 9. Role-based Scoping: Counsellor 2 cannot view Counsellor 1's beneficiary
  try {
    const res = await fetch(`${API_BASE}/beneficiary/${beneficiaryId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${counsellor2Token}` },
    });
    assert.strictEqual(res.status, 403);
    console.log('✅ TEST PASS: Counsellor 2 blocked from accessing Counsellor 1\'s beneficiary.');
  } catch (err) {
    console.error('❌ TEST FAIL: Scoping guard failed:', err.message);
    process.exit(1);
  }

  console.log('\n🎉 ALL SECURITY, ROLE, AND VALIDATION TESTS PASSED SUCCESSFULLY! 🎉');
};

runTests();
