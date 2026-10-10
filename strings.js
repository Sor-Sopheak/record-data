/* ===== ALL TEXT lives here. Edit the words only, keep the keys (left side). ===== */
const STR = {
  title: "កំណត់ត្រាបច្ច័យ និងចំណាយ",
  search: "ស្វែងរក (ឈ្មោះអ្នកចូលបច្ច័យ, កំណត់សម្គាល់...)",
  filterCur: "រូបិយប័ណ្ណ",
  filterMet: "វិធីបង់ប្រាក់",

  // ===== TABS =====
  tabIncome: "កំណត់ត្រាបច្ច័យបុណ្យ",
  tabExpense: "កំណត់ត្រាចំណាយ",

  // left panel
  newSheet: "បង្កើតតារាងថ្មី",
  sheetName: "ឈ្មោះតារាង",
  create: "+ បង្កើតតារាង",
  sheets: "តារាងទិន្នន័យ (✓ ដើម្បីទាញយក)",
  expCur: "តារាងបច្ចុប្បន្ន",
  expSel: "តារាងបាន ✓",
  expAll: "ទាំងអស់",
  backup: "បម្រុងទុក",
  saveJson: "ទាញយក JSON",
  restoreJson: "បញ្ចូល JSON",
  noSheets: "មិនទាន់មានតារាងទិន្នន័យនៅឡើយទេ។",
  exportButtonOptions: "ប៊ូតុងសម្រាប់ទាញយកទិន្នន័យជា excel",
  entriesCount: (n) => `${n} ទិន្នន័យ`,
  donorCount: (n) => `ចំនួនអ្នកចូលបច្ច័យបុណ្យសរុប៖ ${n} នាក់`,
  renameBtn: "កែឈ្មោះតារាង",
  renameTitle: "កែឈ្មោះតារាង",
  renamePrompt: "ឈ្មោះតារាងថ្មី៖",

  // ===== EXPENSE (ចំណាយ) =====
  expNewSheet: "បង្កើតតារាងចំណាយថ្មី",
  expSheetName: "ឈ្មោះតារាងចំណាយ",
  expCreate: "+ បង្កើតតារាងចំណាយ",
  expSheets: "តារាងចំណាយ (✓ ដើម្បីទាញយក)",
  expAddEntry: "បញ្ចូលព័ត៌មានចំណាយ",
  expEditEntry: "កែប្រែព័ត៌មានចំណាយ",
  expPayee: "ឈ្មោះទំនិញ / អ្នកទទួលប្រាក់",
  expItem: "ទំនិញ / សេវា",
  expNoEntries: "មិនទាន់មានទិន្នន័យចំណាយនៅឡើយទេ",
  expEmptyMain:
    "បង្កើតតារាងចំណាយរបស់អ្នកនៅខាងឆ្វេង (ឧ. ទិញសម្ភារៈ, ជួលតង់, អាហារ)។",
  expDonorCount: (n) => `ចំនួនចំណាយសរុប៖ ${n} កំណត់ត្រា`,

  // entry form
  addEntry: "បញ្ចូលព័ត៌មានអ្នកចូលបច្ច័យបុណ្យ",
  editEntry: "កែប្រែព័ត៌មាន",
  donorName: "ឈ្មោះអ្នកចូលបច្ច័យបុណ្យ",
  amt: "ចំនួនទឹកប្រាក់",
  note: "កំណត់សម្គាល់",
  pickDate: "ជ្រើសរើសកាលបរិច្ឆេទ",
  add: "បញ្ចូល",
  update: "រក្សាទុក",
  cancel: "បោះបង់",
  open: "បើក",
  edit: "កែប្រែ",

  grandTotal: "សរុបរួម",
  grandInUSD: "សរុបជា ដុល្លា",
  grandInKHR: "សរុបជា រៀល",

  expPDF: "ទាញយក PDF",
  noPdf: "មិនទាន់មាន PDF library ទេ។ សូមបើកទំនេរនេះជាមួយអ៊ីនធឺណិតម្តង។",

  // main area
  total: "សរុប",
  results: "លទ្ធផលស្វែងរក",
  noEntries: "មិនទាន់មានទិន្នន័យនៅឡើយទេ",
  emptyMain:
    "បង្កើតតារាងកំណត់ត្រារបស់អ្នកនៅខាងឆ្វេង (ឧ. ថវិកាឧបត្ថម្ភ, ការចំណាយលើសម្ភារៈ)។",

  newSheetDesc: "ជ្រើសរើសឈ្មោះតារាងថ្មីដែលមានស្រាប់ ឬបញ្ចូលថ្មី",
  expNewSheetDesc: "ជ្រើសរើសឈ្មោះតារាងថ្មីដែលមានស្រាប់ ឬបញ្ចូលថ្មី",

  // khmer dates (used by fmtDate in app.js)
  months: [
    "មករា",
    "កុម្ភៈ",
    "មីនា",
    "មេសា",
    "ឧសភា",
    "មិថុនា",
    "កក្កដា",
    "សីហា",
    "កញ្ញា",
    "តុលា",
    "វិច្ឆិកា",
    "ធ្នូ",
  ],
  digits: "០១២៣៤៥៦៧៨៩",
  weekdays: ["អា", "ច", "អ", "ពុ", "ព្រ", "សុ", "ស"], // calendar header, Sunday first
  todayBtn: "ថ្ងៃនេះ",
  dateShort: (d, m, y) => `${d} ${m} ${y}`, // in tables and lists

  // column titles
  cols: {
    no: "#",
    sheet: "តារាង",
    date: "កាលបរិច្ឆេទ",
    name: "ឈ្មោះ",
    amt: "ចំនួនទឹកប្រាក់",
    cur: "រូបិយប័ណ្ណ",
    method: "វិធីបង់ប្រាក់",
    note: "កំណត់សម្គាល់",
  },

  // popups & dialogs
  modalTitleWarning: "ការជូនដំណឹង",
  modalTitleConfirm: "ការបញ្ជាក់",
  btnOk: "យល់ព្រម",
  btnCancel: "បោះបង់",
  btnConfirm: "យល់ព្រម",

  needName: "សូមបញ្ចូលឈ្មោះ",
  needAmt: "សូមបញ្ចូលចំនួនទឹកប្រាក់",
  needSheetName: "សូមបញ្ចូលឈ្មោះតារាង",
  noSheetSel: "មិនទាន់បានជ្រើសតារាង",
  dupConfirm: (n) => `"${n}" មានរួចហើយនៅក្នុងតារាងនេះ។ តើអ្នកនៅតែចង់បន្ថែមឬ?`,
  delEntryConfirm: "តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?",
  delSheetConfirm: (n, c) =>
    `តើអ្នកពិតជាចង់លុបតារាង "${n}" និងទិន្នន័យ ${c} ទាំងអស់មែនទេ?`,
  restoreConfirm:
    "ទិន្នន័យបច្ចុប្បន្នទាំងអស់នឹងត្រូវជំនួសដោយ backup នេះ? តើអ្នកពិតជាចង់បន្តទេ?",
  badBackup: "ឯកសារ Backup មិនត្រឹមត្រូវទេ",
  noXlsx: "មិនទាន់មាន Excel library ទេ។ សូមបើកទំព័រនេះជាមួយអ៊ីនធឺណិតម្តង។",

  // currency short labels
  curKHR: "រៀល",
  curUSD: "ដុល្លា",
};

// quick-name buttons under "New sheet"
const PRESETS = [
  "បច្ច័យបុណ្យ (៣ថ្ងៃ)",
  "បច្ច័យបុណ្យ (៧ថ្ងៃ)",
  "ថវិកាឧបត្ថម្ភផ្សេងៗ",
];
// payment method dropdown
const METHODS = ["សាច់ប្រាក់", "QR"];
// font used inside the exported Excel file (must be installed on the computer that opens it)
const XL_FONT = "Khmer OS Battambang";

// amount units: typing 10 + ម៉ឺន = 100,000. Edit label / mult freely
const UNITS = [
  { label: "ឯកតា", mult: 1 },
  { label: "ពាន់", mult: 1000 },
  { label: "ម៉ឺន", mult: 10000 },
  { label: "សែន", mult: 100000 },
  { label: "លាន", mult: 1000000 },
  { label: "ដប់លាន", mult: 10000000 },
];

const PRESETS_EXP = [
  "ទិញសម្ភារៈ",
  "ជួលតង់ / តុកៅអី",
  "អាហារ / ភេសជ្ជៈ",
  "តុបតែង",
  "ចំណាយផ្សេងៗ",
];

// how you paid (expense side)
const METHODS_EXP = ["សាច់ប្រាក់", "QR", "ផ្ទេរប្រាក់"];
