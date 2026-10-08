const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// US State abbreviations for extraction
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP'
];

// US State names mapping
const STATE_NAMES = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming',
  'DC': 'District of Columbia',
  'PR': 'Puerto Rico',
  'VI': 'Virgin Islands',
  'GU': 'Guam',
  'AS': 'American Samoa',
  'MP': 'Northern Mariana Islands'
};

// Get state name from abbreviation
export function getStateName(abbr) {
  return STATE_NAMES[abbr] || abbr;
}

// Extract state abbreviation from address
export function extractState(address) {
  if (!address) return null;
  const upper = address.toUpperCase();
  // Match 2-letter state abbreviation (usually followed by comma or space and zip)
  for (const state of US_STATES) {
    const regex = new RegExp(`\\b${state}\\b`, 'i');
    if (regex.test(upper)) return state;
  }
  return null;
}

// Builds a Mongo filter from URLSearchParams (shared by list + CSV export)
export function buildFilter(sp) {
  const f = {};
  const q = sp.get('q');
  if (q) {
    const re = new RegExp(escapeRe(q), 'i');
    f.$or = [{ name: re }, { address: re }, { phone: re }, { email: re }];
  }
  if (sp.get('category')) f.category = new RegExp(escapeRe(sp.get('category')), 'i');
  if (sp.get('city')) f.address = new RegExp(escapeRe(sp.get('city')), 'i');
  if (sp.get('hasEmail') === 'true') f.email = { $exists: true, $ne: '' };
  if (sp.get('hasPhone') === 'true') f.phone = { $exists: true, $ne: '' };
  if (sp.get('hasWebsite') === 'true') f.website = { $exists: true, $ne: '' };

  // State filter - extract from address
  const state = sp.get('state');
  if (state) {
    f.address = new RegExp(`\\b${escapeRe(state)}\\b`, 'i');
  }

  // Status filter: pending | reached | convince | signed | dead
  const status = sp.get('status');
  if (status && ['pending', 'reached', 'convince', 'signed', 'dead'].includes(status)) {
    f.status = status;
  }

  return f;
}
