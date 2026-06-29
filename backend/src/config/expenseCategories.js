const EXPENSE_CATEGORIES = [
  { name: 'Rent & Lease',              description: 'Shop rent, property lease, storage rent',           isRecurring: true  },
  { name: 'Salaries & Wages',          description: 'Staff salaries, wages, contractor payments',         isRecurring: true  },
  { name: 'Utilities',                 description: 'Electricity, water, internet, phone bills',          isRecurring: true  },
  { name: 'Transportation & Delivery', description: 'Delivery costs, fuel, vehicle maintenance',          isRecurring: false },
  { name: 'Inventory & Packaging',     description: 'Packaging materials, consumables for stock',         isRecurring: false },
  { name: 'Maintenance & Repairs',     description: 'Shop repairs, equipment servicing',                  isRecurring: false },
  { name: 'Marketing & Advertising',   description: 'Ads, banners, promotions, social media',             isRecurring: false },
  { name: 'Professional Services',     description: 'Accountant, lawyer, consultant fees',                isRecurring: false },
  { name: 'Insurance & Compliance',    description: 'Business insurance, license fees, compliance costs', isRecurring: true  },
  { name: 'Banking & Financial',       description: 'Bank charges, loan EMI, payment gateway fees',       isRecurring: true  },
  { name: 'Technology & Software',     description: 'Software subscriptions, hardware, IT support',       isRecurring: false },
  { name: 'Staff & Employee',          description: 'Uniforms, training, staff welfare expenses',         isRecurring: false },
  { name: 'Office & Shop Supplies',    description: 'Stationery, printer ink, small office items',        isRecurring: false },
  { name: 'Customer & Vendor',         description: 'Customer gifts, vendor entertainment, hospitality',  isRecurring: false },
  { name: 'Miscellaneous',             description: 'Any other business expense not listed above',        isRecurring: false },
];

module.exports = EXPENSE_CATEGORIES;
