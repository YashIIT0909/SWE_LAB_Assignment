export const NOTATIONS = [
  ['UML', 'DESIGN'],
  ['ERD', 'DESIGN'],
  ['Structured Design', 'DESIGN'],
  ['DFD', 'DESIGN'],
  ['Java', 'CODE'],
  ['Python', 'CODE'],
  ['C', 'CODE'],
  ['C++', 'CODE'],
  ['JavaScript', 'CODE'],
  ['TypeScript', 'CODE'],
] as const

/** [name, kind, notation, category, keywords, description] */
export const DEMO_COMPONENTS = [
  [
    'CSV parser',
    'CODE',
    'Python',
    'Parsing',
    ['csv', 'parser', 'stream'],
    'Streaming RFC 4180 CSV parser with quoted field support.',
  ],
  [
    'JSON tokenizer',
    'CODE',
    'C',
    'Parsing',
    ['json', 'tokenizer', 'parser'],
    'Allocation-free JSON tokenizer.',
  ],
  [
    'Merge sort',
    'CODE',
    'C++',
    'Sorting and searching',
    ['sort', 'merge', 'stable'],
    'Stable O(n log n) merge sort on iterators.',
  ],
  [
    'Binary search',
    'CODE',
    'Java',
    'Sorting and searching',
    ['search', 'binary', 'array'],
    'Generic binary search over sorted arrays.',
  ],
  [
    'Library system ERD',
    'DESIGN',
    'ERD',
    'Data processing',
    ['library', 'entity', 'relationship'],
    'Entities and relationships for a lending library.',
  ],
  [
    'Order processing DFD',
    'DESIGN',
    'DFD',
    'Data processing',
    ['order', 'data-flow', 'context'],
    'Level-0 and level-1 data flow diagrams for order processing.',
  ],
  [
    'Login form widget',
    'CODE',
    'JavaScript',
    'UI widgets',
    ['form', 'login', 'validation'],
    'Accessible login form with client-side validation.',
  ],
  [
    'JWT auth middleware',
    'CODE',
    'TypeScript',
    'Authentication',
    ['jwt', 'auth', 'middleware'],
    'Express middleware verifying Bearer JWTs.',
  ],
  [
    'Payroll structure chart',
    'DESIGN',
    'Structured Design',
    'Data processing',
    ['payroll', 'structure-chart', 'modules'],
    'Structure chart decomposing a payroll system into modules.',
  ],
] as const

/** Same shape as DEMO_COMPONENTS. Seeded with createdAt ~60 days ago and no uses, so they show
 * up as purge candidates with the default purge settings. */
export const STALE_DEMO_COMPONENTS = [
  [
    'Legacy XML parser',
    'CODE',
    'Java',
    'Parsing',
    ['xml', 'parser', 'sax'],
    'Old SAX-based XML parser nobody has needed since the JSON rewrite.',
  ],
  [
    'Bubble sort demo',
    'CODE',
    'C',
    'Sorting and searching',
    ['sort', 'bubble', 'teaching'],
    'Textbook bubble sort kept from an earlier course exercise.',
  ],
  [
    'Old billing DFD',
    'DESIGN',
    'DFD',
    'Data processing',
    ['billing', 'data-flow', 'legacy'],
    'Data flow diagram of a billing process that was replaced.',
  ],
] as const

export const STALE_DEMO_AGE_DAYS = 60
