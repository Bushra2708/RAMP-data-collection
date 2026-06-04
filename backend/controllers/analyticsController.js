import { Op } from 'sequelize';
import Beneficiary from '../models/Beneficiary.js';
import Activity from '../models/Activity.js';
import Counsellor from '../models/Counsellor.js';

// @desc    Get dashboard summary statistics & district distribution
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Core Summary Metrics
    const totalBeneficiaries = await Beneficiary.count();

    // ESDP completed count
    const totalEsdp = await Beneficiary.count({
      where: { 'esdpTraining.trainingCompleted': 'Yes' }
    });

    // Existing Entrepreneurs count
    const existingEntrepreneurs = await Beneficiary.count({
      where: { 'entrepreneurProfile.existingEntrepreneur': 'Yes' }
    });

    // New Entrepreneurs count
    const newEntrepreneurs = await Beneficiary.count({
      where: {
        'entrepreneurProfile.existingEntrepreneur': 'No',
        'entrepreneurProfile.interestedInNewBusiness': 'Yes'
      }
    });
    
    // Use Activity table for Udyam count
    const udyamActivities = await Activity.findAll({
      attributes: ['beneficiary'],
      where: {
        supportCategory: 'Udyam Registration',
        status: 'Completed',
      },
      group: ['beneficiary'],
      raw: true
    });
    const udyamCount = udyamActivities.length;

    // ONDC count
    const ondcCount = await Beneficiary.count({
      where: { 'marketAccess.ondcRegistered': 'Yes' }
    });

    // GeM count
    const gemCount = await Beneficiary.count({
      where: { 'marketAccess.gemRegistered': 'Yes' }
    });

    // Loans Facilitated (loanAmountSanctioned > 0)
    // Wait, in JSONB:
    const loansFacilitated = await Beneficiary.count({
      where: {
        [Op.and]: [
          { 'loanTracking.loanApplied': 'Yes' },
          Op.literal(`CAST("Beneficiary"."loanTracking"->>'loanAmountSanctioned' AS NUMERIC) > 0`)
        ]
      }
    });
    
    // Enterprises Established: Status Active or Udyam completed
    const activeEnterprises = await Beneficiary.count({
      where: { 'entrepreneurProfile.businessStatus': 'Active' }
    });
    const enterprisesEstablished = Math.max(activeEnterprises, udyamCount);

    // 2. Fetch all beneficiaries for JS aggregation (efficient and dialect-independent for charts)
    const list = await Beneficiary.findAll({ raw: true });

    // A. District-Wise Distribution
    const districtGroups = {};
    list.forEach((b) => {
      const dist = b.personalInfo?.district || 'Unspecified';
      if (!districtGroups[dist]) {
        districtGroups[dist] = { beneficiaries: 0, entrepreneurs: 0, loansCount: 0, totalLoans: 0 };
      }
      districtGroups[dist].beneficiaries += 1;
      if (b.entrepreneurProfile?.existingEntrepreneur === 'Yes') {
        districtGroups[dist].entrepreneurs += 1;
      }
      const loanAmt = Number(b.loanTracking?.loanAmountSanctioned) || 0;
      if (loanAmt > 0) {
        districtGroups[dist].loansCount += 1;
        districtGroups[dist].totalLoans += loanAmt;
      }
    });
    const districtStats = Object.keys(districtGroups).map((dist) => ({
      district: dist,
      beneficiaries: districtGroups[dist].beneficiaries,
      entrepreneurs: districtGroups[dist].entrepreneurs,
      loansCount: districtGroups[dist].loansCount,
      totalLoans: districtGroups[dist].totalLoans,
    })).sort((a, b) => b.beneficiaries - a.beneficiaries);

    // B. Sector Distribution (Pie Chart data)
    const sectorGroups = {};
    list.forEach((b) => {
      const sector = b.entrepreneurProfile?.enterpriseSector;
      if (sector && sector.trim() !== '') {
        sectorGroups[sector] = (sectorGroups[sector] || 0) + 1;
      }
    });
    const sectorStats = Object.keys(sectorGroups).map((name) => ({
      name,
      value: sectorGroups[name],
    }));

    // C. Monthly Trend Data (Last 6 Months)
    const monthlyTrend = [];
    const dateLimit = new Date();
    dateLimit.setMonth(dateLimit.getMonth() - 5);
    dateLimit.setDate(1); // Start from beginning of month 6 months ago

    const trendGroups = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    list.forEach((b) => {
      const date = new Date(b.createdAt);
      if (date >= dateLimit) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const key = `${year}-${month}`;
        trendGroups[key] = (trendGroups[key] || 0) + 1;
      }
    });

    Object.keys(trendGroups).map((key) => {
      const [year, month] = key.split('-').map(Number);
      return {
        year,
        month,
        monthLabel: `${monthNames[month]} ${year}`,
        count: trendGroups[key],
      };
    }).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .forEach((item) => {
        monthlyTrend.push({
          month: item.monthLabel,
          beneficiaries: item.count,
        });
      });

    res.json({
      success: true,
      summary: {
        totalBeneficiaries,
        totalEsdp,
        existingEntrepreneurs,
        newEntrepreneurs,
        udyamCount,
        ondcCount,
        gemCount,
        loansFacilitated,
        enterprisesEstablished,
      },
      districtStats,
      sectorStats,
      monthlyTrend,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
