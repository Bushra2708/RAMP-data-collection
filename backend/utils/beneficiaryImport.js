import sequelize from '../config/db.js';
import Beneficiary from '../models/Beneficiary.js';
import Counsellor from '../models/Counsellor.js';
import MasterData from '../models/MasterData.js';

const COLUMN_ALIASES = {
  beneficiaryId: ['beneficiaryId', 'Beneficiary ID', 'RBHMS ID', 'ID'],
  fullName: ['fullName', 'Full Name', 'Name', 'Beneficiary Name'],
  mobileNumber: ['mobileNumber', 'Mobile Number', 'Mobile', 'Phone', 'Contact Number'],
  emailId: ['emailId', 'Email', 'Email ID'],
  gender: ['gender', 'Gender'],
  age: ['age', 'Age'],
  district: ['district', 'District'],
  mandal: ['mandal', 'Mandal'],
  village: ['village', 'Village'],
  address: ['address', 'Address', 'Residential Address'],
  shgName: ['shgName', 'SHG Name', 'SHG', 'Self Help Group'],
  educationalQualification: ['educationalQualification', 'Qualification', 'Education', 'Educational Qualification'],
  aadhaarNumber: ['aadhaarNumber', 'Aadhaar Number', 'Aadhaar', 'Aadhar Number'],
  panNumber: ['panNumber', 'PAN Number', 'PAN'],
  counsellorMobile: ['counsellorMobile', 'Counsellor Mobile', 'Counsellor Phone', 'Assigned Counsellor Mobile'],
  existingEntrepreneur: ['existingEntrepreneur', 'Existing Entrepreneur', 'Existing MSME'],
  enterpriseName: ['enterpriseName', 'Enterprise Name', 'Business Name'],
  enterpriseSector: ['enterpriseSector', 'Enterprise Sector', 'Sector', 'Business Sector'],
  enterpriseType: ['enterpriseType', 'Enterprise Type', 'Business Type'],
  businessStatus: ['businessStatus', 'Business Status'],
  esdpBatchNumber: ['esdpBatchNumber', 'ESDP Batch Number', 'ESDP Batch', 'Batch Number', 'Batch Code'],
  esdpBatchName: ['esdpBatchName', 'ESDP Batch Name', 'Batch Name', 'Batch Course Name', 'Course Name'],
  esdpBatchDistrict: ['esdpBatchDistrict', 'ESDP Batch District', 'Batch District', 'Venue District'],
  esdpBatchVenue: ['esdpBatchVenue', 'ESDP Batch Venue', 'Batch Venue', 'Venue', 'Venue Address'],
  esdpBatchStartDate: ['esdpBatchStartDate', 'ESDP Start Date', 'Batch Start Date', 'Start Date'],
  esdpBatchEndDate: ['esdpBatchEndDate', 'ESDP End Date', 'Batch End Date', 'End Date'],
  trainingCompleted: ['trainingCompleted', 'Training Completed', 'ESDP Completed'],
  loanApplied: ['loanApplied', 'Loan Applied'],
  loanScheme: ['loanScheme', 'Loan Scheme'],
  loanAmountSanctioned: ['loanAmountSanctioned', 'Loan Amount Sanctioned', 'Loan Sanctioned Amount'],
  udyamRegistrationNumber: ['udyamRegistrationNumber', 'Udyam Number', 'Udyam Registration Number', 'Udyam Registration'],
};

export function getRowValue(row, fieldKey) {
  const aliases = COLUMN_ALIASES[fieldKey] || [fieldKey];
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value])
  );
  for (const name of aliases) {
    const value = normalized[name.toLowerCase()];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function mergeSection(existing = {}, incoming = {}) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      merged[key] = value;
    }
  }
  return merged;
}

async function findExistingBeneficiary({ beneficiaryId, mobileNumber, aadhaarNumber }) {
  if (beneficiaryId) {
    const byId = await Beneficiary.findOne({ where: { beneficiaryId } });
    if (byId) return byId;
  }
  if (mobileNumber) {
    const byMobile = await Beneficiary.findOne({
      where: sequelize.literal(
        `"Beneficiary"."personalInfo"->>'mobileNumber' = ${sequelize.escape(mobileNumber)}`
      ),
    });
    if (byMobile) return byMobile;
  }
  if (aadhaarNumber) {
    const byAadhaar = await Beneficiary.findOne({
      where: sequelize.literal(
        `"Beneficiary"."personalInfo"->>'aadhaarNumber' = ${sequelize.escape(aadhaarNumber)}`
      ),
    });
    if (byAadhaar) return byAadhaar;
  }
  return null;
}

async function resolveCounsellorId(mobile) {
  if (!mobile) return null;
  const counsellor = await Counsellor.findOne({ where: { mobileNumber: mobile } });
  return counsellor?.id || null;
}

/** Create missing ESDP batches in master data before beneficiary import. */
export async function ensureEsdpBatchesFromImportRows(rows) {
  let master = await MasterData.findOne({ where: { category: 'esdpBatches' } });
  if (!master) {
    master = await MasterData.create({ category: 'esdpBatches', items: [] });
  }

  const batches = [...(master.items || [])];
  const byNumber = new Map(batches.map((b) => [b.batchNumber, b]));
  const created = [];

  for (const row of rows) {
    const batchNumber = getRowValue(row, 'esdpBatchNumber');
    if (!batchNumber || byNumber.has(batchNumber)) continue;

    const newBatch = {
      batchNumber,
      batchName: getRowValue(row, 'esdpBatchName') || batchNumber,
      district: getRowValue(row, 'esdpBatchDistrict') || getRowValue(row, 'district') || 'Unspecified',
      venue: getRowValue(row, 'esdpBatchVenue') || 'To Be Confirmed',
      startDate: getRowValue(row, 'esdpBatchStartDate') || '',
      endDate: getRowValue(row, 'esdpBatchEndDate') || '',
    };

    batches.push(newBatch);
    byNumber.set(batchNumber, newBatch);
    created.push(batchNumber);
  }

  if (created.length > 0) {
    master.items = batches;
    master.changed('items', true);
    await master.save();
  }

  return { createdCount: created.length, createdBatchNumbers: created };
}

async function resolveEsdpTraining(batchNumber, existing = {}) {
  if (!batchNumber) return null;
  const master = await MasterData.findOne({ where: { category: 'esdpBatches' } });
  const batches = master?.items || [];
  const batch = batches.find((b) => b.batchNumber === batchNumber);
  const training = mergeSection(existing, {
    batchNumber,
    batchName: batch?.batchName || existing.batchName || '',
    district: batch?.district || existing.district || '',
    trainingVenue: batch?.venue || existing.trainingVenue || '',
    startDate: batch?.startDate || existing.startDate || '',
    endDate: batch?.endDate || existing.endDate || '',
  });
  return training;
}

export function mapImportRow(row) {
  const ageRaw = getRowValue(row, 'age');
  const loanRaw = getRowValue(row, 'loanAmountSanctioned');

  return {
    beneficiaryId: getRowValue(row, 'beneficiaryId'),
    personalInfo: {
      fullName: getRowValue(row, 'fullName'),
      mobileNumber: getRowValue(row, 'mobileNumber'),
      emailId: getRowValue(row, 'emailId'),
      gender: getRowValue(row, 'gender') || 'Male',
      age: ageRaw ? Number(ageRaw) : undefined,
      district: getRowValue(row, 'district'),
      mandal: getRowValue(row, 'mandal'),
      village: getRowValue(row, 'village'),
      address: getRowValue(row, 'address'),
      shgName: getRowValue(row, 'shgName'),
      educationalQualification: getRowValue(row, 'educationalQualification') || 'SSC',
      aadhaarNumber: getRowValue(row, 'aadhaarNumber'),
      panNumber: getRowValue(row, 'panNumber'),
    },
    counsellorMobile: getRowValue(row, 'counsellorMobile'),
    entrepreneurProfile: {
      existingEntrepreneur: getRowValue(row, 'existingEntrepreneur') || 'No',
      enterpriseName: getRowValue(row, 'enterpriseName'),
      enterpriseSector: getRowValue(row, 'enterpriseSector'),
      enterpriseType: getRowValue(row, 'enterpriseType'),
      businessStatus: getRowValue(row, 'businessStatus'),
    },
    esdpBatchNumber: getRowValue(row, 'esdpBatchNumber'),
    esdpTraining: {
      trainingCompleted: getRowValue(row, 'trainingCompleted') || 'No',
    },
    loanTracking: {
      loanApplied: getRowValue(row, 'loanApplied') || 'No',
      loanScheme: getRowValue(row, 'loanScheme'),
      loanAmountSanctioned: loanRaw ? Number(loanRaw) : undefined,
    },
    compliance: {
      udyamRegistrationNumber: getRowValue(row, 'udyamRegistrationNumber'),
    },
  };
}

export async function upsertBeneficiaryFromImport(mapped) {
  const { beneficiaryId, personalInfo, counsellorMobile, entrepreneurProfile, esdpBatchNumber, esdpTraining, loanTracking, compliance } = mapped;

  if (!personalInfo.fullName || !personalInfo.mobileNumber || !personalInfo.shgName) {
    throw new Error(`Row missing required fields (Full Name, Mobile Number, SHG Name) for "${personalInfo.fullName || personalInfo.mobileNumber || 'unknown'}".`);
  }

  const existing = await findExistingBeneficiary({
    beneficiaryId,
    mobileNumber: personalInfo.mobileNumber,
    aadhaarNumber: personalInfo.aadhaarNumber,
  });

  const counsellorId = await resolveCounsellorId(counsellorMobile);
  const esdpMerged = esdpBatchNumber
    ? await resolveEsdpTraining(esdpBatchNumber, existing?.esdpTraining || {})
    : null;

  if (existing) {
    existing.personalInfo = mergeSection(existing.personalInfo, personalInfo);
    existing.entrepreneurProfile = mergeSection(existing.entrepreneurProfile, entrepreneurProfile);
    existing.loanTracking = mergeSection(existing.loanTracking, loanTracking);
    existing.compliance = mergeSection(existing.compliance, compliance);
    if (esdpMerged) {
      existing.esdpTraining = mergeSection(existing.esdpTraining, { ...esdpMerged, ...esdpTraining });
    } else if (Object.keys(esdpTraining).some((k) => esdpTraining[k])) {
      existing.esdpTraining = mergeSection(existing.esdpTraining, esdpTraining);
    }
    if (counsellorId) existing.assignedCounsellorId = counsellorId;

    existing.changed('personalInfo', true);
    existing.changed('entrepreneurProfile', true);
    existing.changed('loanTracking', true);
    existing.changed('compliance', true);
    existing.changed('esdpTraining', true);

    const timeline = [...(existing.timeline || [])];
    timeline.push({
      date: new Date(),
      title: 'Profile Updated via Excel Import',
      description: `Record matched and merged using mobile ${personalInfo.mobileNumber}.`,
      type: 'Import',
    });
    existing.timeline = timeline;
    existing.changed('timeline', true);

    await existing.save();
    return { action: 'updated', beneficiary: existing };
  }

  const createData = {
    personalInfo,
    entrepreneurProfile,
    loanTracking,
    compliance,
    esdpTraining: esdpMerged ? { ...esdpMerged, ...esdpTraining } : esdpTraining,
  };
  if (counsellorId) createData.assignedCounsellorId = counsellorId;

  const created = await Beneficiary.create(createData);
  return { action: 'created', beneficiary: created };
}

export const IMPORT_TEMPLATE_HEADERS = [
  'Beneficiary ID',
  'Full Name',
  'Mobile Number',
  'Email',
  'Gender',
  'Age',
  'District',
  'Mandal',
  'Village',
  'Address',
  'SHG Name',
  'Qualification',
  'Aadhaar Number',
  'PAN Number',
  'Counsellor Mobile',
  'Existing Entrepreneur',
  'Enterprise Name',
  'Enterprise Sector',
  'Enterprise Type',
  'Business Status',
  'ESDP Batch Number',
  'ESDP Batch Name',
  'ESDP Batch District',
  'ESDP Batch Venue',
  'ESDP Batch Start Date',
  'ESDP Batch End Date',
  'Training Completed',
  'Loan Applied',
  'Loan Scheme',
  'Loan Amount Sanctioned',
  'Udyam Registration Number',
];
