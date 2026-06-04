import MasterData from '../models/MasterData.js';

// Seed initial master data if empty
export const seedInitialMasterData = async () => {
  try {
    const count = await MasterData.count();
    if (count > 0) return; // Master data already seeded

    const defaults = [
      {
        category: 'districts',
        items: [
          'Hyderabad',
          'Warangal',
          'Medchal-Malkajgiri',
          'Rangareddy',
          'Sangareddy',
          'Karimnagar',
          'Nizamabad',
          'Nalgonda',
          'Khammam',
          'Mahabubnagar',
        ],
      },
      {
        category: 'mandals',
        items: [
          'Hanamkonda',
          'Khila Warangal',
          'Ghatkesar',
          'Kukatpally',
          'Serilingampally',
          'Patancheru',
          'Karimnagar',
          'Nalgonda',
          'Wyra',
        ],
      },
      {
        category: 'villages',
        items: [
          'Madhapur',
          'Kompally',
          'Rampally',
          'Rudraram',
          'Velimela',
          'Ainthpur',
          'Kaniparthi',
          'Nizampet',
        ],
      },
      {
        category: 'sectors',
        items: [
          'Food Processing',
          'Textiles & Apparel',
          'General Engineering',
          'Chemical & Plastics',
          'Leather & Footwear',
          'IT & Electronics',
          'Handicrafts & Handlooms',
          'Agro & Allied Services',
          'Retail & Trading',
          'Healthcare & Medical',
          'Other Manufacturing',
          'Other Services',
        ],
      },
      {
        category: 'esdpBatches',
        items: [
          {
            batchNumber: 'ESDP-2026-B01',
            batchName: 'Food Processing & Packaging',
            district: 'Warangal',
            venue: 'ALEAP Skill Development Center, Warangal',
            startDate: '2026-01-10',
            endDate: '2026-02-10',
          },
          {
            batchNumber: 'ESDP-2026-B02',
            batchName: 'Garment Manufacturing Technology',
            district: 'Medchal-Malkajgiri',
            venue: 'ALEAP Industrial Area, Gajularamaram',
            startDate: '2026-02-15',
            endDate: '2026-03-15',
          },
          {
            batchNumber: 'ESDP-2026-B03',
            batchName: 'Digital Marketing & E-Commerce',
            district: 'Hyderabad',
            venue: 'ALEAP HQ, Hyderabad',
            startDate: '2026-03-01',
            endDate: '2026-03-31',
          },
        ],
      },
      {
        category: 'supportCategories',
        items: [
          'Udyam Registration',
          'DPIIT Registration',
          'GST Registration',
          'Trade License',
          'FSSAI Registration',
          'Trademark Registration',
          'Barcode Registration',
          'ONDC Registration',
          'GeM Registration',
          'ZED Certification',
          'Lean Certification',
          'PMEGP',
          'PMMY',
          'PM Vishwakarma',
          'PMFME',
          'CGTMSE',
          'Vendor Development',
          'Market Support',
          'Brand Promotion',
          'Raw Material Support',
          'Product Diversification',
          'Networking Support',
          'Access to Loan',
          'Enablement of Investment',
          'Regulatory Compliance',
          'Any Other Support',
        ],
      },
    ];

    for (const d of defaults) {
      await MasterData.create(d);
    }
    console.log('Master data successfully seeded.');
  } catch (err) {
    console.error('Error seeding master data:', err.message);
  }
};

// @desc    Get all master data categories
// @route   GET /api/master-data
// @access  Public
export const getMasterData = async (req, res) => {
  try {
    const list = await MasterData.findAll();
    const formatted = {};
    list.forEach((m) => {
      formatted[m.category] = m.items;
    });
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update a specific master data category list
// @route   POST /api/master-data/:category
// @access  Private/Admin
export const updateMasterData = async (req, res) => {
  const { category } = req.params;
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'Invalid items. Must be an array.' });
  }

  try {
    let master = await MasterData.findOne({ where: { category } });
    if (!master) {
      master = new MasterData({ category, items });
    } else {
      master.items = items;
    }
    await master.save();
    res.json({ success: true, message: `${category} master data updated successfully`, items: master.items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
