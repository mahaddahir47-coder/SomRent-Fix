/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'technician' | 'supervisor';
export type TicketStatus = 'assigned' | 'started' | 'paused' | 'waiting_for_parts' | 'waiting_approval' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  role: Role;
  username: string;
  phone?: string;
  specialty?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  district: string; // e.g. Hodan, Waberi, Bondhere
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  tenantName: string;
  tenantPhone: string;
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  propertyId: string;
  unitId: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId?: string; // technician id
  category: string;
  tenantNotes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completionNotes?: string;
}

export interface MaintenanceUpdate {
  id: string;
  ticketId: string;
  statusBefore: TicketStatus;
  statusAfter: TicketStatus;
  actorId: string;
  actorName: string;
  actorRole: Role;
  notes: string;
  timestamp: string;
}

export interface MaintenancePhoto {
  id: string;
  ticketId: string;
  url: string; // base64 or simulated URI
  caption: string;
  timestamp: string;
  step: 'before' | 'after' | 'proof';
}

export interface MaintenanceCost {
  id: string;
  ticketId: string;
  item: string;
  quantity: number;
  unitCost: number; // in USD
  laborCost: number; // in USD
  estimatedTotal: number;
  finalCost: number;
  approvalNeeded: boolean;
  status: 'pending' | 'approved';
  createdAt: string;
}

// Translation structures for Somali & English
export type Language = 'en' | 'so';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  login: string;
  username: string;
  password: string;
  role: string;
  technician: string;
  supervisor: string;
  selectRole: string;
  enterCredentials: string;
  errorLogin: string;
  successLogin: string;
  loading: string;
  dashboard: string;
  myJobs: string;
  jobDetails: string;
  status: string;
  updateStatus: string;
  costs: string;
  photos: string;
  newPhoto: string;
  reports: string;
  profile: string;
  settings: string;
  priority: string;
  property: string;
  unit: string;
  tenant: string;
  assigned: string;
  started: string;
  paused: string;
  waiting_for_parts: string;
  waiting_approval: string;
  resolved: string;
  closed: string;
  low: string;
  medium: string;
  high: string;
  urgent: string;
  todayJobs: string;
  urgentJobs: string;
  overdueJobs: string;
  completedJobs: string;
  pendingApprovals: string;
  tenantNotes: string;
  internalNotes: string;
  timeline: string;
  acceptJob: string;
  startJob: string;
  pauseJob: string;
  addCost: string;
  costLogging: string;
  materials: string;
  quantity: string;
  unitCost: string;
  laborCost: string;
  estimatedTotal: string;
  finalCost: string;
  approvalNeededCheck: string;
  saveCost: string;
  cancel: string;
  searchJobs: string;
  filterByProperty: string;
  filterByPriority: string;
  filterByStatus: string;
  photoGallery: string;
  noPhotos: string;
  addCaption: string;
  takePhoto: string;
  choosePhoto: string;
  uploadPhoto: string;
  before: string;
  after: string;
  proof: string;
  completionWorkflow: string;
  completionNotesPlaceholder: string;
  managerApprovalReq: string;
  closeTicket: string;
  districtLabel: string;
  phoneLabel: string;
  logout: string;
  languageSelect: string;
  themeSelect: string;
  darkMode: string;
  lightMode: string;
  totalSpend: string;
  materialsCost: string;
  laborCostTotal: string;
  syncConnection: string;
  syncSuccess: string;
  regionDispatchCode: string;
  seedReset: string;
  activeJobs: string;
  assignedToYou: string;
  addNote: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appName: "SomRent Fix",
    tagline: "Field service & repair portal for SomRent properties",
    login: "Log In",
    username: "Username",
    password: "Password",
    role: "User Role",
    technician: "Technician / Farsamo Yaqaanka",
    supervisor: "Supervisor / Kormeeraha",
    selectRole: "Choose Your Account Profile",
    enterCredentials: "Use pre-loaded credentials to test the full-stack system.",
    errorLogin: "Invalid credentials or role mismatch.",
    successLogin: "Logged in successfully!",
    loading: "Loading data...",
    dashboard: "Dashboard",
    myJobs: "My Jobs",
    jobDetails: "Job Details",
    status: "Status",
    updateStatus: "Update Status",
    costs: "Cost Logs",
    photos: "Photos",
    newPhoto: "Upload Photo",
    reports: "Reports",
    profile: "My Profile",
    settings: "Settings",
    priority: "Priority",
    property: "Property",
    unit: "Unit",
    tenant: "Tenant Name",
    assigned: "Assigned",
    started: "In Progress",
    paused: "Paused",
    waiting_for_parts: "Waiting for Parts",
    waiting_approval: "Waiting for Approval",
    resolved: "Resolved (Ready)",
    closed: "Closed & Finalized",
    low: "Low Priority",
    medium: "Medium Priority",
    high: "High Priority",
    urgent: "Urgent Repair",
    todayJobs: "Assigned Today",
    urgentJobs: "Urgent Jobs",
    overdueJobs: "Overdue Actions",
    completedJobs: "Completed Tasks",
    pendingApprovals: "Pending Approvals",
    tenantNotes: "Tenant-Facing Notes",
    internalNotes: "Internal / Supervisor Notes",
    timeline: "Job activity Timeline",
    acceptJob: "Accept Ticket",
    startJob: "Start Work",
    pauseJob: "Pause Work",
    addCost: "Record New Costs",
    costLogging: "Cost & Material Logging",
    materials: "Materials / Item Name",
    quantity: "Qty",
    unitCost: "Unit Price ($)",
    laborCost: "Labor Charge ($)",
    estimatedTotal: "Estimated Total ($)",
    finalCost: "Final Amount ($)",
    approvalNeededCheck: "Requires Supervisor Approval",
    saveCost: "Save Cost Log",
    cancel: "Cancel",
    searchJobs: "Search by ticket / notes...",
    filterByProperty: "Filter by Property",
    filterByPriority: "Filter by Priority",
    filterByStatus: "Filter by Status",
    photoGallery: "Before & After Photos",
    noPhotos: "No photo uploaded yet.",
    addCaption: "Describe the photo (caption)",
    takePhoto: "Simulate Snap Photo",
    choosePhoto: "Select File",
    uploadPhoto: "Upload Photo File",
    before: "Before Action",
    after: "After Action",
    proof: "Final proof (Manager inspect)",
    completionWorkflow: "Complete Work Order",
    completionNotesPlaceholder: "Type final checklist remarks here for closure...",
    managerApprovalReq: "Confirm Job inspected and verified",
    closeTicket: "Submit and Close Ticket",
    districtLabel: "District",
    phoneLabel: "Phone Number",
    logout: "Log Out",
    languageSelect: "Select UI Language",
    themeSelect: "Interface Mode",
    darkMode: "Dark Mode On",
    lightMode: "Light Mode (Standard)",
    totalSpend: "Total Maintenance Value",
    materialsCost: "Supply & Material Expenses",
    laborCostTotal: "Labor and Repairs Logged",
    syncConnection: "SomRent Sync Server Status",
    syncSuccess: "Fully Connected to SomRent Admin",
    regionDispatchCode: "Mogadishu Dispatch Hub Region",
    seedReset: "Re-Seed Default Demo Data",
    activeJobs: "Active Repair Jobs",
    assignedToYou: "My Active Assignments",
    addNote: "Add Action Note"
  },
  so: {
    appName: "SomRent Fix",
    tagline: "Adeegga cilad-saarka iyo dayactirka dhismayaasha SomRent",
    login: "Soo gal",
    username: "Magaca isticmaalaha",
    password: "Furaha sirta ah",
    role: "Nooca Shaqada",
    technician: "Farsamo Yaqaanka (Technician)",
    supervisor: "Kormeeraha (Supervisor)",
    selectRole: "Dooro Nidaamkaaga",
    enterCredentials: "Isticmaal aqoonsiyada diyaarka ah si aad u tijaabiso.",
    errorLogin: "Magaca ama sirta aad gelisay way khaldan yihiin.",
    successLogin: "Waa ku guulaysatay inaad soo gasho!",
    loading: "Waa la soo rarayaa macluumaadka...",
    dashboard: "Kobta Kore",
    myJobs: "Shaqooyinkayga",
    jobDetails: "Faahfaahinta",
    status: "Heerka",
    updateStatus: "Wax ka beddel Heerka",
    costs: "Diiwaanka Kharashka",
    photos: "Sawirrada",
    newPhoto: "Geli Sawir",
    reports: "Warbixinnada",
    profile: "Profile-kayga",
    settings: "Habeynta",
    priority: "Muhiimadda",
    property: "Dhismaha",
    unit: "Guriga",
    tenant: "Magaca Kiraystaha",
    assigned: "Laguu xil saaray",
    started: "Faraha ayaa kula jira",
    paused: "Waa loo yara hakiyay",
    waiting_for_parts: "Waxaa loo sugayaa qalab",
    waiting_approval: "Waxaa loo sugayaa ogolaansho",
    resolved: "Waa la hagaajiyay (Ok)",
    closed: "Waa la xidhay gebi ahaanba",
    low: "Yar (Heer hoose)",
    medium: "Dhexdhexaad",
    high: "Sare (Degdeg)",
    urgent: "Aad u daran (Ma canbbaaro)",
    todayJobs: "Shaqooyinka Maanta",
    urgentJobs: "Aad u Degdeg ah",
    overdueJobs: "Dib u dhacay",
    completedJobs: "Shaqooyinka dhamaaday",
    pendingApprovals: "Sugaya Ogolaanshaha",
    tenantNotes: "Ogeysiiska Kireystaha",
    internalNotes: "Xusuus-qorka Kormeeraha",
    timeline: "Taariikhda updates-ka shaqada",
    acceptJob: "Aqbal Tikidhka shaqada",
    startJob: "Billaaw Shaqada",
    pauseJob: "Haki Shaqada",
    addCost: "Diiwaangeli Kharash Cilad-saar",
    costLogging: "Xisaabinta Qalabka & Shaqaalaha",
    materials: "Qalabka la isticmaalay / Magaca",
    quantity: "Cadadka",
    unitCost: "Qiimaha xabbadii ($)",
    laborCost: "Kharashka gacanta farsamada ($)",
    estimatedTotal: "Wadar ku-meel-gaar ah ($)",
    finalCost: "Wadarta Guud ee Rasmiga ah ($)",
    approvalNeededCheck: "Wuxuu u baahan yahay fasax maamule",
    saveCost: "Kaydi Diiwaanka Kharashka",
    cancel: "Ka noqo",
    searchJobs: "Ka raadi shaqooyinka ama warbixinta...",
    filterByProperty: "U kala saar dhismaha",
    filterByPriority: "U kala saar muhiimadda",
    filterByStatus: "U kala saar heerka laga joogo",
    photoGallery: "Sawirradii Hore iyo Ka Dib",
    noPhotos: "Ma jiro sawir la soo geliyay weli.",
    addCaption: "Sharaxaad kooban ka bixi sawirka",
    takePhoto: "Ku tijaabi sawir qaadis",
    choosePhoto: "Dooro fail sawir",
    uploadPhoto: "Soo geli sawirro",
    before: "Intaan la hagaajin kahor",
    after: "Dayactirka kaberi",
    proof: "Caddayn lagu hubinayo (Inspector)",
    completionWorkflow: "Dhameystir Tikidhka Shaqada",
    completionNotesPlaceholder: "Ku qor halkan xusuus daryeel oo dhameystiran si loo xidho...",
    managerApprovalReq: "Xaqiijiyay in shaqada la hubiyay lana weyneeyay",
    closeTicket: "Geri oo xir Tikidhka dhibaatada",
    districtLabel: "Xaafada",
    phoneLabel: "Lambarka Taleefanka",
    logout: "Ka bax",
    languageSelect: "Dooro Luqadda Interface-ka",
    themeSelect: "Muuqaalka Interface-ka",
    darkMode: "Habka Mugdiga (Madow)",
    lightMode: "Habka Caadiga ah (Cad)",
    totalSpend: "Wadarta Guud ee Dayactirka",
    materialsCost: "Kharashka Qalabka loo iibiyey",
    laborCostTotal: "Dayactirrada iyo Farsamada",
    syncConnection: "Xaaladda Server-ka SomRent",
    syncSuccess: "Si buuxda ugu xidhan SomRent Admin",
    regionDispatchCode: "Magaalada Mogadishu Control Gacanta",
    seedReset: "Dib u daji xogta tijaabada ah",
    activeJobs: "Mashaariic Cilad-saar oo Firfircoon",
    assignedToYou: "Dayactirrada adiga kuu gaar ah",
    addNote: "Ku dar qoraal update ah"
  }
};
