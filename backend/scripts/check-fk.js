import sequelize from '../config/db.js';
import '../models/Counsellor.js';
import '../models/Admin.js';
import '../models/Beneficiary.js';
import '../models/Activity.js';
import MasterData from '../models/MasterData.js';

await sequelize.authenticate();

const [orphanBeneficiaries] = await sequelize.query(`
  SELECT b.id, b."beneficiaryId", b."assignedCounsellorId"
  FROM "Beneficiary" b
  LEFT JOIN "Counsellor" c ON b."assignedCounsellorId" = c.id
  WHERE b."assignedCounsellorId" IS NOT NULL AND c.id IS NULL
`);

const [adminAsCounsellor] = await sequelize.query(`
  SELECT b.id, b."beneficiaryId", b."assignedCounsellorId", a."fullName" as admin_name
  FROM "Beneficiary" b
  INNER JOIN "Admin" a ON b."assignedCounsellorId" = a.id
  LEFT JOIN "Counsellor" c ON b."assignedCounsellorId" = c.id
  WHERE c.id IS NULL
`);

const esdp = await MasterData.findOne({ where: { category: 'esdpBatches' } });

console.log('Orphan beneficiaries:', orphanBeneficiaries.length, JSON.stringify(orphanBeneficiaries, null, 2));
console.log('Beneficiaries assigned to Admin IDs:', adminAsCounsellor.length, JSON.stringify(adminAsCounsellor, null, 2));
console.log('ESDP batches in DB:', esdp ? esdp.items.length : 'MISSING CATEGORY');

process.exit(0);
