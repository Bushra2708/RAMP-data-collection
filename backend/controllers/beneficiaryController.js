import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import Beneficiary from '../models/Beneficiary.js';
import Counsellor from '../models/Counsellor.js';
import Activity from '../models/Activity.js';
import BeneficiaryDocument from '../models/BeneficiaryDocument.js';
import { storageType, deleteFile } from '../middleware/upload.js';
import fs from 'fs';
import path from 'path';
import { logAudit } from '../middleware/auditLogger.js';

// @desc    Register a new beneficiary
// @route   POST /api/beneficiary
// @access  Private
export const registerBeneficiary = async (req, res) => {
  const { personalInfo, esdpTraining, entrepreneurProfile } = req.body;

  if (!personalInfo || !personalInfo.fullName || !personalInfo.mobileNumber) {
    return res.status(400).json({ success: false, message: 'Full Name and Mobile Number are required.' });
  }

  try {
    // 1. Check duplicate Mobile Number (using JSONB extraction)
    const duplicateMobile = await Beneficiary.findOne({
      where: sequelize.literal(
        `"Beneficiary"."personalInfo"->>'mobileNumber' = ${sequelize.escape(personalInfo.mobileNumber)}`
      )
    });
    if (duplicateMobile) {
      return res.status(400).json({
        success: false,
        message: `A beneficiary with mobile number ${personalInfo.mobileNumber} is already registered.`,
        duplicateField: 'mobileNumber',
        existingId: duplicateMobile.id,
        existingBeneficiaryId: duplicateMobile.beneficiaryId,
      });
    }

    // 2. Check duplicate Aadhaar Number (if provided)
    if (personalInfo.aadhaarNumber && personalInfo.aadhaarNumber.trim() !== '') {
      const duplicateAadhaar = await Beneficiary.findOne({
        where: sequelize.literal(
          `"Beneficiary"."personalInfo"->>'aadhaarNumber' = ${sequelize.escape(personalInfo.aadhaarNumber)}`
        )
      });
      if (duplicateAadhaar) {
        return res.status(400).json({
          success: false,
          message: `A beneficiary with Aadhaar number ${personalInfo.aadhaarNumber} is already registered.`,
          duplicateField: 'aadhaarNumber',
          existingId: duplicateAadhaar.id,
          existingBeneficiaryId: duplicateAadhaar.beneficiaryId,
        });
      }
    }

    // 3. Create profile
    const beneficiaryData = {
      personalInfo,
      esdpTraining: esdpTraining || {},
      entrepreneurProfile: entrepreneurProfile || {},
    };

    // Assign Counsellor if registered by a Counsellor
    if (req.role === 'Counsellor') {
      beneficiaryData.assignedCounsellorId = req.user.id;
    }

    const beneficiary = await Beneficiary.create(beneficiaryData);

    await logAudit({
      req,
      action: 'CREATE_BENEFICIARY',
      entity: 'Beneficiary',
      entityId: beneficiary.id,
      details: {
        beneficiaryId: beneficiary.beneficiaryId,
        fullName: personalInfo.fullName,
        mobileNumber: personalInfo.mobileNumber
      }
    });

    res.status(201).json({
      success: true,
      message: 'Beneficiary registered successfully.',
      beneficiary,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all beneficiaries with advanced search, filters & pagination
// @route   GET /api/beneficiary?page=1&limit=20&search=...
// @access  Private
export const getBeneficiaries = async (req, res) => {
  try {
    const where = {};

    // Enforce counsellor scoping (Counsellors only view assigned beneficiaries)
    if (req.role === 'Counsellor') {
      where.assignedCounsellorId = req.user.id;
    }

    const {
      search, district, village, shgName, enterpriseName,
      registrationStatus, loanStatus, marketAccessStatus, counsellorId,
      page = 1, limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const andConditions = [];

    if (search) {
      andConditions.push({
        [Op.or]: [
          sequelize.literal(`"Beneficiary"."personalInfo"->>'fullName' ILIKE ${sequelize.escape(`%${search}%`)}`),
          sequelize.literal(`"Beneficiary"."personalInfo"->>'mobileNumber' ILIKE ${sequelize.escape(`%${search}%`)}`),
          { beneficiaryId: { [Op.iLike]: `%${search}%` } }
        ]
      });
    }

    if (district) {
      andConditions.push(
        sequelize.literal(`"Beneficiary"."personalInfo"->>'district' = ${sequelize.escape(district)}`)
      );
    }
    if (village) {
      andConditions.push(
        sequelize.literal(`"Beneficiary"."personalInfo"->>'village' ILIKE ${sequelize.escape(`%${village}%`)}`)
      );
    }
    if (shgName) {
      andConditions.push(
        sequelize.literal(`"Beneficiary"."personalInfo"->>'shgName' ILIKE ${sequelize.escape(`%${shgName}%`)}`)
      );
    }
    if (enterpriseName) {
      andConditions.push(
        sequelize.literal(`"Beneficiary"."entrepreneurProfile"->>'enterpriseName' ILIKE ${sequelize.escape(`%${enterpriseName}%`)}`)
      );
    }

    // Admin can filter by specific counsellor
    if (req.role === 'Admin' && counsellorId) {
      where.assignedCounsellorId = counsellorId;
    }

    // Registration Status filters
    if (registrationStatus) {
      if (registrationStatus === 'Udyam Registered') {
        const udyamActivities = await Activity.findAll({
          attributes: ['beneficiary_id'],
          where: { supportCategory: 'Udyam Registration', status: 'Completed' },
          raw: true,
        });
        const udyamBeneficiaryIds = udyamActivities.map(a => a.beneficiary_id);
        where.id = { [Op.in]: udyamBeneficiaryIds.length > 0 ? udyamBeneficiaryIds : ['00000000-0000-0000-0000-000000000000'] };
      }
      if (registrationStatus === 'GST Registered') {
        andConditions.push(
          sequelize.literal(`"Beneficiary"."compliance"->>'gstNumber' IS NOT NULL AND "Beneficiary"."compliance"->>'gstNumber' != ''`)
        );
      }
    }

    // Loan Status filters
    if (loanStatus) {
      if (loanStatus === 'Applied') {
        andConditions.push(
          sequelize.literal(`"Beneficiary"."loanTracking"->>'loanApplied' = 'Yes'`)
        );
      }
      if (loanStatus === 'Sanctioned') {
        andConditions.push(
          sequelize.literal(`CAST(NULLIF("Beneficiary"."loanTracking"->>'loanAmountSanctioned', '') AS NUMERIC) > 0`)
        );
      }
    }

    // Market Access filters
    if (marketAccessStatus) {
      if (marketAccessStatus === 'ONDC') {
        andConditions.push(
          sequelize.literal(`"Beneficiary"."marketAccess"->>'ondcRegistered' = 'Yes'`)
        );
      }
      if (marketAccessStatus === 'GeM') {
        andConditions.push(
          sequelize.literal(`"Beneficiary"."marketAccess"->>'gemRegistered' = 'Yes'`)
        );
      }
    }

    if (andConditions.length > 0) {
      where[Op.and] = andConditions;
    }

    const { count, rows } = await Beneficiary.findAndCountAll({
      where,
      include: [{
        model: Counsellor,
        as: 'assignedCounsellor',
        attributes: ['fullName', 'mobileNumber', 'district'],
      }],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    res.json({
      success: true,
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum),
      count: rows.length,
      beneficiaries: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get beneficiary by ID
// @route   GET /api/beneficiary/:id
// @access  Private
export const getBeneficiaryById = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findByPk(req.params.id, {
      include: [{
        model: Counsellor,
        as: 'assignedCounsellor',
        attributes: ['fullName', 'mobileNumber', 'district'],
      }]
    });

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found.' });
    }

    // Auth validation — counsellors can only see their own beneficiaries
    if (req.role === 'Counsellor' && String(beneficiary.assignedCounsellorId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this profile.' });
    }

    const [handholdingActivities, documents] = await Promise.all([
      Activity.findAll({
        where: { beneficiary_id: req.params.id },
        order: [['activityDate', 'DESC']],
      }),
      BeneficiaryDocument.findAll({
        where: { beneficiary_id: req.params.id },
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const fullProfile = beneficiary.toJSON();
    fullProfile.handholdingActivities = handholdingActivities;
    fullProfile.documents = documents;

    res.json({ success: true, beneficiary: fullProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update beneficiary profile details
// @route   PUT /api/beneficiary/:id
// @access  Private
export const updateBeneficiary = async (req, res) => {
  try {
    let beneficiary = await Beneficiary.findByPk(req.params.id);
    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found.' });
    }

    if (req.role === 'Counsellor' && String(beneficiary.assignedCounsellorId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile.' });
    }

    const {
      personalInfo, esdpTraining, entrepreneurProfile,
      dprTracking, loanTracking, compliance, marketAccess, certifications,
    } = req.body;

    const timelineEvents = [];

    if (esdpTraining && esdpTraining.trainingCompleted !== beneficiary.esdpTraining?.trainingCompleted) {
      if (esdpTraining.trainingCompleted === 'Yes') {
        timelineEvents.push({
          date: new Date(),
          title: 'Completed ESDP Training',
          description: `Successfully completed training batch: ${esdpTraining.batchName || 'ESDP Batch'}`,
          type: 'Training',
        });
      }
    }

    if (dprTracking && dprTracking.dprPrepared !== beneficiary.dprTracking?.dprPrepared) {
      if (dprTracking.dprPrepared === 'Yes') {
        timelineEvents.push({
          date: new Date(),
          title: 'DPR Prepared',
          description: 'Detailed Project Report (DPR) prepared for submission.',
          type: 'DPR',
        });
      }
    }

    if (loanTracking && loanTracking.loanApplied !== beneficiary.loanTracking?.loanApplied) {
      if (loanTracking.loanApplied === 'Yes') {
        timelineEvents.push({
          date: new Date(),
          title: 'Loan Applied',
          description: `Applied for loan under scheme: ${loanTracking.loanScheme || 'N/A'}`,
          type: 'Loan',
        });
      }
    }

    if (loanTracking && Number(loanTracking.loanAmountSanctioned) > 0 && (!beneficiary.loanTracking || !Number(beneficiary.loanTracking.loanAmountSanctioned))) {
      timelineEvents.push({
        date: new Date(),
        title: 'Loan Sanctioned',
        description: `Loan of ₹${loanTracking.loanAmountSanctioned} approved.`,
        type: 'Loan',
      });
    }

    if (personalInfo) {
      beneficiary.personalInfo = { ...beneficiary.personalInfo, ...personalInfo };
      beneficiary.changed('personalInfo', true);
    }
    if (esdpTraining) {
      beneficiary.esdpTraining = { ...beneficiary.esdpTraining, ...esdpTraining };
      beneficiary.changed('esdpTraining', true);
    }
    if (entrepreneurProfile) {
      beneficiary.entrepreneurProfile = { ...beneficiary.entrepreneurProfile, ...entrepreneurProfile };
      beneficiary.changed('entrepreneurProfile', true);
    }
    if (dprTracking) {
      beneficiary.dprTracking = { ...beneficiary.dprTracking, ...dprTracking };
      beneficiary.changed('dprTracking', true);
    }
    if (loanTracking) {
      beneficiary.loanTracking = { ...beneficiary.loanTracking, ...loanTracking };
      beneficiary.changed('loanTracking', true);
    }
    if (compliance) {
      beneficiary.compliance = { ...beneficiary.compliance, ...compliance };
      beneficiary.changed('compliance', true);
    }
    if (marketAccess) {
      beneficiary.marketAccess = { ...beneficiary.marketAccess, ...marketAccess };
      beneficiary.changed('marketAccess', true);
    }
    if (certifications) {
      beneficiary.certifications = { ...beneficiary.certifications, ...certifications };
      beneficiary.changed('certifications', true);
    }

    if (timelineEvents.length > 0) {
      beneficiary.timeline = [...(beneficiary.timeline || []), ...timelineEvents];
      beneficiary.changed('timeline', true);
    }

    await beneficiary.save();

    await logAudit({
      req,
      action: 'UPDATE_BENEFICIARY',
      entity: 'Beneficiary',
      entityId: beneficiary.id,
      details: {
        beneficiaryId: beneficiary.beneficiaryId,
        updatedFields: Object.keys(req.body)
      }
    });

    const [handholdingActivities, documents] = await Promise.all([
      Activity.findAll({
        where: { beneficiary_id: req.params.id },
        order: [['activityDate', 'DESC']],
      }),
      BeneficiaryDocument.findAll({
        where: { beneficiary_id: req.params.id },
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const fullProfile = beneficiary.toJSON();
    fullProfile.handholdingActivities = handholdingActivities;
    fullProfile.documents = documents;

    res.json({ success: true, message: 'Profile updated successfully.', beneficiary: fullProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add Handholding Support Activity Log
// @route   POST /api/beneficiary/:id/activity
// @access  Private
export const addActivity = async (req, res) => {
  const { supportCategory, description, status, remarks, nextFollowUpDate, activityDate } = req.body;

  if (!supportCategory || !description) {
    return res.status(400).json({ success: false, message: 'Support Category and Description are required.' });
  }

  try {
    const beneficiary = await Beneficiary.findByPk(req.params.id);
    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found.' });
    }

    if (req.role === 'Counsellor' && String(beneficiary.assignedCounsellorId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Activity.create({
      beneficiary_id: req.params.id,
      activityDate: activityDate || new Date(),
      counsellorName: req.user.fullName,
      counsellorId: req.user.id,
      supportCategory,
      description,
      status: status || 'Not Started',
      remarks,
      nextFollowUpDate: nextFollowUpDate || null,
    });

    // Add timeline event
    const updatedTimeline = [...(beneficiary.timeline || [])];
    if (status === 'Completed') {
      updatedTimeline.push({
        date: new Date(),
        title: `${supportCategory} Completed`,
        description: `Handholding support for ${supportCategory} completed successfully.`,
        type: 'Handholding',
      });
    } else {
      updatedTimeline.push({
        date: new Date(),
        title: `${supportCategory} Logged`,
        description: `Support status: ${status}. Logged: "${description}"`,
        type: 'Handholding',
      });
    }
    beneficiary.timeline = updatedTimeline;
    beneficiary.changed('timeline', true);
    await beneficiary.save();

    await logAudit({
      req,
      action: 'ADD_ACTIVITY',
      entity: 'Activity',
      details: {
        beneficiaryId: req.params.id,
        supportCategory,
        status
      }
    });

    const [handholdingActivities, documents] = await Promise.all([
      Activity.findAll({
        where: { beneficiary_id: req.params.id },
        order: [['activityDate', 'DESC']],
      }),
      BeneficiaryDocument.findAll({
        where: { beneficiary_id: req.params.id },
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const fullProfile = beneficiary.toJSON();
    fullProfile.handholdingActivities = handholdingActivities;
    fullProfile.documents = documents;

    res.json({ success: true, message: 'Handholding activity logged.', beneficiary: fullProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upload document file (Cloudinary or local)
// @route   POST /api/beneficiary/:id/upload
// @access  Private
export const uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const { category, documentName } = req.body;
  if (!category || !documentName) {
    if (storageType === 'local' && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch(e) {}
    }
    return res.status(400).json({ success: false, message: 'Category and documentName are required.' });
  }

  try {
    console.log('FILE RECEIVED:', req.file);
    console.log('FILES RECEIVED:', req.files);
    console.log('BODY:', req.body);
    const uploadedFile = req.file;
    console.log('UPLOAD RESULT:', uploadedFile);

    const beneficiary = await Beneficiary.findByPk(req.params.id);
    if (!beneficiary) {
      if (storageType === 'local' && req.file.path) try { fs.unlinkSync(req.file.path); } catch(e) {}
      return res.status(404).json({ success: false, message: 'Beneficiary not found.' });
    }

    if (req.role === 'Counsellor' && String(beneficiary.assignedCounsellorId) !== String(req.user.id)) {
      if (storageType === 'local' && req.file.path) try { fs.unlinkSync(req.file.path); } catch(e) {}
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    let docPath, publicId, format, documentUrl, originalFilename, fileType;

    if (storageType === 's3') {
      docPath = req.file.location;
      publicId = req.file.key;
      documentUrl = req.file.location;
      originalFilename = req.file.originalname;
      fileType = req.file.mimetype;
      format = path.extname(req.file.originalname).substring(1).toUpperCase() || 'FILE';
    } else if (storageType === 'cloudinary') {
      docPath = req.file.path;
      publicId = req.file.filename;
      documentUrl = req.file.path;
      originalFilename = req.file.originalname || req.file.original_filename || req.file.originalFilename;
      fileType = req.file.mimetype || req.file.resource_type || 'application/octet-stream';
      format = path.extname(req.file.originalname).substring(1).toUpperCase() || 'FILE';
    } else {
      docPath = `/upload/${req.file.filename}`;
      publicId = null;
      documentUrl = `${process.env.API_BASE || ''}${docPath}`;
      originalFilename = req.file.originalname;
      fileType = req.file.mimetype;
      format = path.extname(req.file.originalname).substring(1).toUpperCase();
    }

    const documentEntry = await BeneficiaryDocument.create({
      beneficiary: req.params.id,
      category,
      name: documentName,
      path: docPath,
      documentUrl,
      public_id: publicId,
      original_filename: originalFilename,
      fileType,
      format,
      uploadedBy: req.user.id,
      uploadedByRole: req.role,
    });

    await logAudit({
      req,
      action: 'UPLOAD_DOCUMENT',
      entity: 'BeneficiaryDocument',
      entityId: documentEntry.id,
      details: {
        beneficiaryId: req.params.id,
        category,
        documentName,
        format,
        path: docPath
      }
    });

    const { fileSlot } = req.body;
    if (fileSlot) {
      const updatedFiles = { ...beneficiary.files };
      updatedFiles[fileSlot] = {
        path: docPath,
        documentUrl,
        publicId,
        originalFilename,
        fileType,
        name: documentName,
      };
      beneficiary.files = updatedFiles;
      beneficiary.changed('files', true);
    }

    const updatedTimeline = [...(beneficiary.timeline || [])];
    updatedTimeline.push({
      date: new Date(),
      title: 'Document Uploaded',
      description: `Uploaded "${documentName}" under category: ${category}` + (fileSlot ? ` (Field: ${fileSlot})` : ''),
      type: 'Info',
    });
    beneficiary.timeline = updatedTimeline;
    beneficiary.changed('timeline', true);

    await beneficiary.save();

    const [handholdingActivities, documents] = await Promise.all([
      Activity.findAll({
        where: { beneficiary_id: req.params.id },
        order: [['activityDate', 'DESC']],
      }),
      BeneficiaryDocument.findAll({
        where: { beneficiary_id: req.params.id },
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const fullProfile = beneficiary.toJSON();
    fullProfile.handholdingActivities = handholdingActivities;
    fullProfile.documents = documents;

    res.json({ success: true, message: 'Document uploaded and linked to profile.', beneficiary: fullProfile, document: documentEntry });
  } catch (err) {
    if (storageType === 'local' && req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch(e) {}
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete document (Admin Only)
// @route   DELETE /api/beneficiary/:id/document/:docId
// @access  Private/Admin
export const deleteDocument = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findByPk(req.params.id);
    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found.' });
    }

    const doc = await BeneficiaryDocument.findOne({
      where: { id: req.params.docId, beneficiary_id: req.params.id }
    });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document entry not found in profile.' });
    }

    await deleteFile(doc.publicId, doc.path);

    await BeneficiaryDocument.destroy({ where: { id: doc.id } });

    await logAudit({
      req,
      action: 'DELETE_DOCUMENT',
      entity: 'BeneficiaryDocument',
      entityId: doc.id,
      details: {
        beneficiaryId: req.params.id,
        documentName: doc.name,
        category: doc.category
      }
    });

    const updatedTimeline = [...(beneficiary.timeline || [])];
    updatedTimeline.push({
      date: new Date(),
      title: 'Document Deleted',
      description: `Document "${doc.name}" was deleted by administrator.`,
      type: 'Info',
    });
    beneficiary.timeline = updatedTimeline;
    beneficiary.changed('timeline', true);
    await beneficiary.save();

    const [handholdingActivities, documents] = await Promise.all([
      Activity.findAll({
        where: { beneficiary_id: req.params.id },
        order: [['activityDate', 'DESC']],
      }),
      BeneficiaryDocument.findAll({
        where: { beneficiary_id: req.params.id },
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const fullProfile = beneficiary.toJSON();
    fullProfile.handholdingActivities = handholdingActivities;
    fullProfile.documents = documents;

    res.json({ success: true, message: 'Document deleted successfully.', beneficiary: fullProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
