import { Op } from 'sequelize';
import Beneficiary from '../models/Beneficiary.js';
import Counsellor from '../models/Counsellor.js';
import Activity from '../models/Activity.js';

// @desc    Get structured report data
// @route   GET /api/reports/:reportType
// @access  Private/Admin
export const getReportData = async (req, res) => {
  const { reportType } = req.params;

  try {
    let reportData = [];
    let headers = [];

    switch (reportType) {
      case 'beneficiary-master': {
        headers = ['Beneficiary ID', 'Full Name', 'Mobile Number', 'District', 'Mandal', 'Village', 'SHG Name', 'Qualification', 'Existing Entrepreneur', 'Assigned Counsellor'];
        const beneficiaries = await Beneficiary.findAll({
          include: [{ model: Counsellor, as: 'assignedCounsellor', attributes: ['fullName'] }],
          order: [['createdAt', 'DESC']],
        });
        reportData = beneficiaries.map(b => [
          b.beneficiaryId || '',
          b.personalInfo?.fullName || '',
          b.personalInfo?.mobileNumber || '',
          b.personalInfo?.district || '',
          b.personalInfo?.mandal || '',
          b.personalInfo?.village || '',
          b.personalInfo?.shgName || 'None',
          b.personalInfo?.educationalQualification || '',
          b.entrepreneurProfile?.existingEntrepreneur || 'No',
          b.assignedCounsellor?.fullName || 'Unassigned',
        ]);
        break;
      }

      case 'district-wise': {
        headers = ['District', 'Total Beneficiaries', 'Existing Entrepreneurs', 'New Entrepreneurs', 'Loans Facilitated'];
        const beneficiaries = await Beneficiary.findAll({ raw: true });
        const distGroups = {};
        beneficiaries.forEach(b => {
          const dist = b.personalInfo?.district || 'Unspecified';
          if (!distGroups[dist]) distGroups[dist] = { total: 0, existing: 0, newEnt: 0, loans: 0 };
          distGroups[dist].total += 1;
          if (b.entrepreneurProfile?.existingEntrepreneur === 'Yes') {
            distGroups[dist].existing += 1;
          } else {
            distGroups[dist].newEnt += 1;
          }
          if (Number(b.loanTracking?.loanAmountSanctioned) > 0) {
            distGroups[dist].loans += 1;
          }
        });
        reportData = Object.keys(distGroups).map(d => [
          d, distGroups[d].total, distGroups[d].existing, distGroups[d].newEnt, distGroups[d].loans
        ]);
        break;
      }

      case 'esdp': {
        headers = ['Beneficiary ID', 'Full Name', 'Batch Number', 'Batch Name', 'Training Venue', 'Training Completed', 'Certificate Issued'];
        const esdpList = await Beneficiary.findAll({
          where: {
            [Op.and]: [
              { 'esdpTraining.batchNumber': { [Op.ne]: null } },
              { 'esdpTraining.batchNumber': { [Op.ne]: '' } },
            ]
          }
        });
        reportData = esdpList.map(b => [
          b.beneficiaryId || '',
          b.personalInfo?.fullName || '',
          b.esdpTraining?.batchNumber || '',
          b.esdpTraining?.batchName || '',
          b.esdpTraining?.trainingVenue || '',
          b.esdpTraining?.trainingCompleted || 'No',
          b.esdpTraining?.certificateIssued || 'No',
        ]);
        break;
      }

      case 'registration': {
        headers = ['Beneficiary ID', 'Full Name', 'Enterprise Name', 'GST Number', 'Udyam Registration Status', 'ZED Status', 'LEAN Status'];
        const regList = await Beneficiary.findAll();
        let completedUdyamSet = new Set();
        try {
          const udyamActivities = await Activity.findAll({
            attributes: ['beneficiary_id'],
            where: { supportCategory: 'Udyam Registration', status: 'Completed' },
          });
          completedUdyamSet = new Set(udyamActivities.map(a => String(a.beneficiary_id)));
        } catch (e) {
          console.error('Error fetching Udyam activities:', e.message);
        }
        reportData = regList.map(b => {
          const isUdyamRegistered = completedUdyamSet.has(String(b.id));
          return [
            b.beneficiaryId || '',
            b.personalInfo?.fullName || '',
            b.entrepreneurProfile?.enterpriseName || 'N/A',
            b.compliance?.gstNumber || 'Not Registered',
            isUdyamRegistered ? 'Registered' : 'Not Registered',
            b.certifications?.zedStatus || 'Not Applied',
            b.certifications?.leanStatus || 'Not Applied',
          ];
        });
        break;
      }

      case 'loan': {
        headers = ['Beneficiary ID', 'Full Name', 'Loan Scheme', 'Amount Requested', 'Amount Sanctioned', 'Sanction Date', 'Release Date'];
        const loanList = await Beneficiary.findAll({
          where: { 'loanTracking.loanApplied': 'Yes' }
        });
        reportData = loanList.map(b => [
          b.beneficiaryId || '',
          b.personalInfo?.fullName || '',
          b.loanTracking?.loanScheme || 'N/A',
          b.loanTracking?.loanAmountRequested || 0,
          b.loanTracking?.loanAmountSanctioned || 0,
          b.loanTracking?.sanctionDate ? new Date(b.loanTracking.sanctionDate).toLocaleDateString() : 'N/A',
          b.loanTracking?.releaseDate ? new Date(b.loanTracking.releaseDate).toLocaleDateString() : 'N/A',
        ]);
        break;
      }

      case 'scheme': {
        headers = ['Beneficiary ID', 'Full Name', 'PMEGP Status', 'PMMY Status', 'PM Vishwakarma Status', 'PMFME Status', 'CGTMSE Status'];
        const schemeList = await Beneficiary.findAll();
        const schemeCategories = ['PMEGP', 'PMMY', 'PM Vishwakarma', 'PMFME', 'CGTMSE'];
        let statusMap = {};
        try {
          const activities = await Activity.findAll({
            where: { supportCategory: { [Op.in]: schemeCategories } },
            raw: true,
          });
          activities.forEach(a => {
            const bId = String(a.beneficiary_id);
            if (!statusMap[bId]) statusMap[bId] = {};
            statusMap[bId][a.supportCategory] = a.status || 'Not Started';
          });
        } catch (e) {
          console.error('Error fetching scheme activities:', e.message);
        }
        reportData = schemeList.map(b => {
          const bId = String(b.id);
          const getStatus = (cat) => statusMap[bId]?.[cat] || 'Not Applied';
          return [
            b.beneficiaryId || '',
            b.personalInfo?.fullName || '',
            getStatus('PMEGP'),
            getStatus('PMMY'),
            getStatus('PM Vishwakarma'),
            getStatus('PMFME'),
            getStatus('CGTMSE'),
          ];
        });
        break;
      }

      case 'market-access': {
        headers = ['Beneficiary ID', 'Full Name', 'ONDC Registered', 'GeM Registered', 'Amazon Support', 'Meesho Support', 'Brand Promotion'];
        const marketList = await Beneficiary.findAll();
        reportData = marketList.map(b => [
          b.beneficiaryId || '',
          b.personalInfo?.fullName || '',
          b.marketAccess?.ondcRegistered || 'No',
          b.marketAccess?.gemRegistered || 'No',
          b.marketAccess?.eCommercePlatforms?.amazon ? 'Yes' : 'No',
          b.marketAccess?.eCommercePlatforms?.meesho ? 'Yes' : 'No',
          b.marketAccess?.brandPromotionSupportAvailed || 'No',
        ]);
        break;
      }

      case 'enterprise-establishment': {
        headers = ['Beneficiary ID', 'Full Name', 'Enterprise Name', 'Sector', 'Type', 'Status', 'Address'];
        const entList = await Beneficiary.findAll({
          where: {
            [Op.and]: [
              { 'entrepreneurProfile.enterpriseName': { [Op.ne]: null } },
              { 'entrepreneurProfile.enterpriseName': { [Op.ne]: '' } },
            ]
          }
        });
        reportData = entList.map(b => [
          b.beneficiaryId || '',
          b.personalInfo?.fullName || '',
          b.entrepreneurProfile?.enterpriseName || '',
          b.entrepreneurProfile?.enterpriseSector || '',
          b.entrepreneurProfile?.enterpriseType || '',
          b.entrepreneurProfile?.businessStatus || '',
          b.entrepreneurProfile?.businessAddress || '',
        ]);
        break;
      }

      case 'counsellor-performance': {
        headers = ['Counsellor Name', 'District', 'Mobile Number', 'Status', 'Beneficiaries Registered', 'Activities Logged'];
        let counsellors = [];
        try {
          counsellors = await Counsellor.findAll();
        } catch (e) {
          console.error('Error fetching counsellors:', e.message);
        }
        const performanceData = [];
        for (const c of counsellors) {
          let regCount = 0;
          let actCount = 0;
          try {
            regCount = await Beneficiary.count({ where: { assignedCounsellorId: c.id } });
            actCount = await Activity.count({ where: { counsellor_id: c.id } });
          } catch (e) {
            console.error(`Error counting for counsellor ${c.fullName}:`, e.message);
          }
          performanceData.push([
            c.fullName || 'Unknown',
            c.district || 'N/A',
            c.mobileNumber || 'N/A',
            c.status || 'Unknown',
            regCount,
            actCount,
          ]);
        }
        reportData = performanceData;
        break;
      }

      case 'activity': {
        headers = ['Activity Date', 'Beneficiary ID', 'Beneficiary Name', 'Counsellor', 'Category', 'Description', 'Status', 'Next Follow-up'];
        const activities = await Activity.findAll({
          include: [{ model: Beneficiary, as: 'beneficiaryRecord', attributes: ['beneficiaryId', 'personalInfo'] }],
          order: [['activityDate', 'DESC']],
        });
        reportData = activities.map(a => [
          a.activityDate ? new Date(a.activityDate).toLocaleDateString() : '',
          a.beneficiaryRecord?.beneficiaryId || '',
          a.beneficiaryRecord?.personalInfo?.fullName || '',
          a.counsellorName || '',
          a.supportCategory || '',
          a.description || '',
          a.status || '',
          a.nextFollowUpDate ? new Date(a.nextFollowUpDate).toLocaleDateString() : 'N/A',
        ]);
        break;
      }

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type specified' });
    }

    res.json({ success: true, reportType, headers, data: reportData });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error generating report' });
  }
};
