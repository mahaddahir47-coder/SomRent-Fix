/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  User, 
  Property, 
  Unit, 
  MaintenanceTicket, 
  MaintenanceUpdate, 
  MaintenancePhoto, 
  MaintenanceCost,
  TicketStatus,
  TicketPriority
} from "./src/types";

// In-memory Database Store
let database = {
  users: [] as User[],
  properties: [] as Property[],
  units: [] as Unit[],
  tickets: [] as MaintenanceTicket[],
  updates: [] as MaintenanceUpdate[],
  photos: [] as MaintenancePhoto[],
  costs: [] as MaintenanceCost[]
};

// Seeding engine
function runSeeder() {
  // 1. Core Users (3 Technicians, 1 Supervisor)
  const technicians: User[] = [
    { id: "tech_1", name: "Ahmed Shariif", username: "ahmed", role: "technician", phone: "+252-61-5551212", specialty: "Plumbing & Water Systems (Muraaqibka Tubbooyinka)" },
    { id: "tech_2", name: "Sahra Farax", username: "sahra", role: "technician", phone: "+252-61-5553434", specialty: "Electrical & Solar Grid Infrastructure (Korontada)" },
    { id: "tech_3", name: "Cabdi Nuur", username: "cabdi", role: "technician", phone: "+252-61-5557878", specialty: "HVAC Climate Control & Masonry (Qaboojiyeyaasha)" }
  ];

  const supervisors: User[] = [
    { id: "sup_1", name: "Maxamed Kaliil", username: "maxamed", role: "supervisor", phone: "+252-61-5559090", specialty: "Mogadishu West Area Maintenance Supervisor" }
  ];

  database.users = [...technicians, ...supervisors];

  // 2. Properties and Units in Mogadishu
  database.properties = [
    { id: "prop_1", name: "SomRent Shabelle Residence", address: "Maka al-Mukarama Street", district: "Hodan" },
    { id: "prop_2", name: "Bakaara Tower Estates", address: "Bakaara Market Road", district: "Howlwadaag" },
    { id: "prop_3", name: "Liido Beach Heights", address: "Lido Beach Promenade", district: "Abdiaziz" },
    { id: "prop_4", name: "Wadajir Gardens Complex", address: "Halane Security Ring", district: "Wadajir" }
  ];

  database.units = [
    { id: "unit_1_01", propertyId: "prop_1", unitNumber: "Apartment 101", tenantName: "Xasan Cali", tenantPhone: "+252-61-8881234" },
    { id: "unit_1_02", propertyId: "prop_1", unitNumber: "Apartment 102", tenantName: "Amino Cumar", tenantPhone: "+252-61-8885678" },
    { id: "unit_2_A", propertyId: "prop_2", unitNumber: "Office Suite 3A", tenantName: "Daahir Jaamac", tenantPhone: "+252-61-7772211" },
    { id: "unit_2_B", propertyId: "prop_2", unitNumber: "Retail Shop 4", tenantName: "Faadumo Ciise", tenantPhone: "+252-61-7774433" },
    { id: "unit_3_12", propertyId: "prop_3", unitNumber: "Penthouse 1205", tenantName: "Yaxye Bulxan", tenantPhone: "+252-61-9990000" },
    { id: "unit_4_09", propertyId: "prop_4", unitNumber: "Apartment 209", tenantName: "Khadra Yusuf", tenantPhone: "+252-61-5554422" }
  ];

  // 3. Maintenance Tickets - 10 ACTIVE tickets (technician dashboards & pending list) + 5 COMPLETED tickets = 15 total
  const now = new Date();
  const getPastDate = (hoursAgo: number) => {
    const d = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    return d.toISOString();
  };

  // Seeding Tickets (Total 15 -> 10 active and 5 completed)
  database.tickets = [
    // --- 10 ACTIVE / PENDING TICKETS ---
    {
      id: "tick_1",
      title: "Broken Main Water Valve Inflow",
      description: "Water pressure has completely dropped in Flat 101. Main inlet valve appears locked and leaking into the basement.",
      propertyId: "prop_1",
      unitId: "unit_1_01",
      priority: "urgent",
      status: "started", // Active Job 1
      assigneeId: "tech_1",
      category: "Plumbing",
      tenantNotes: "Water completely stopped. Cannot wash or clean.",
      internalNotes: "Check the copper coupling. It usually fails due to high mineral content in the Mogadishu water line.",
      createdAt: getPastDate(12),
      updatedAt: getPastDate(6)
    },
    {
      id: "tick_2",
      title: "Solar Battery Inverter Tripping",
      description: "Lithium backup inverter is shutting down on high-temperature fault, leaving the office without energy during dark hours.",
      propertyId: "prop_2",
      unitId: "unit_2_A",
      priority: "high",
      status: "waiting_for_parts", // Active Job 2
      assigneeId: "tech_2",
      category: "Electrical",
      tenantNotes: "The computers lose power exactly at 6:00 PM when solar transitions to battery.",
      internalNotes: "Requires replacement of cooling exhaust fans. Waiting on the 120mm DC parts order from local vendor.",
      createdAt: getPastDate(48),
      updatedAt: getPastDate(24)
    },
    {
      id: "tick_3",
      title: "Clogged Wastewater Pipeline Blockage",
      description: "Severe grease buildup in the kitchen hub sink is backing up sewer gas down the hallway.",
      propertyId: "prop_1",
      unitId: "unit_1_02",
      priority: "medium",
      status: "assigned", // Active Job 3
      assigneeId: "tech_1",
      category: "Plumbing",
      tenantNotes: "Smell is too bad. Please send someone quickly.",
      internalNotes: "Bring the 25-meter steel snake and heavy duty degreaser.",
      createdAt: getPastDate(4),
      updatedAt: getPastDate(4)
    },
    {
      id: "tick_4",
      title: "A/C Compressor Overheating System",
      description: "AC unit is spitting warm air. Technician needs to test the refrigerant charge and radiator thermal paste.",
      propertyId: "prop_3",
      unitId: "unit_3_12",
      priority: "high",
      status: "paused", // Active Job 4
      assigneeId: "tech_3",
      category: "HVAC",
      tenantNotes: "Too hot in the afternoons. Penthouse is unbearable.",
      internalNotes: "Technician paused the job because of high wind conditions at the rooftop unit. Needs safety harness.",
      createdAt: getPastDate(18),
      updatedAt: getPastDate(10)
    },
    {
      id: "tick_5",
      title: "Corroded Solar Racking Bracket Repair",
      description: "Salty sea breeze at the beach height building has rusted mounting brackets. Panel array is rattling in the wind.",
      propertyId: "prop_3",
      unitId: "unit_3_12",
      priority: "urgent",
      status: "waiting_approval", // Active Job 5
      assigneeId: "tech_2",
      category: "Electrical",
      tenantNotes: "Loud metallic noises coming from roof balcony.",
      internalNotes: "Requires authorization of premium stainless-steel non-corrosive brackets to replace the stock steel ones.",
      createdAt: getPastDate(30),
      updatedAt: getPastDate(12)
    },
    {
      id: "tick_6",
      title: "Electrical Sparking in Bedroom Outlet",
      description: "Wall socket pops audibly when tenant plugs in laptop charger. Severe hazard risk.",
      propertyId: "prop_4",
      unitId: "unit_4_09",
      priority: "urgent",
      status: "started", // Active Job 6
      assigneeId: "tech_2",
      category: "Electrical",
      tenantNotes: "Spark is yellow. We turned off the circuit level fuse.",
      internalNotes: "Isolated bedroom breaker. Outlets must be completely re-wired and replaced with grounded surge protection.",
      createdAt: getPastDate(5),
      updatedAt: getPastDate(2)
    },
    {
      id: "tick_7",
      title: "Water Tank Submersible Pump Overhaul",
      description: "Elevated water tank is not filling on automated triggers. Need to inspect floating limit switch.",
      propertyId: "prop_4",
      unitId: "unit_4_09",
      priority: "medium",
      status: "assigned", 
      assigneeId: "tech_1",
      category: "Plumbing",
      tenantNotes: "Water level is low in bathroom faucets.",
      internalNotes: "Examine water level sensor. May need a heavy-duty copper replacement floating ball.",
      createdAt: getPastDate(8),
      updatedAt: getPastDate(8)
    },
    {
      id: "tick_8",
      title: "Front Door Security Deadbolt Jammed",
      description: "Smart lock cylinder key does not rotate smoothly. Tenant is afraid they will get locked outside.",
      propertyId: "prop_1",
      unitId: "unit_1_01",
      priority: "low",
      status: "assigned",
      assigneeId: "tech_3",
      category: "Civil & Security",
      tenantNotes: "Takes 5 minutes to unlock our main door.",
      internalNotes: "Needs graphite lubrication spray and quick core adjustments. Easy fix.",
      createdAt: getPastDate(14),
      updatedAt: getPastDate(14)
    },
    {
      id: "tick_9",
      title: "Cracked Ceiling Plaster After Drainage Leak",
      description: "Plaster of ceiling hanging low. Previous leak damage now dried up, but structural surface needs renewal.",
      propertyId: "prop_1",
      unitId: "unit_1_02",
      priority: "low",
      status: "assigned",
      assigneeId: "tech_3",
      category: "Civil & Masonry",
      tenantNotes: "Chunks of white powder fall on dining table.",
      internalNotes: "Requires scraping, compound application, and premium matching white acrylic paint coating.",
      createdAt: getPastDate(72),
      updatedAt: getPastDate(72)
    },
    {
      id: "tick_10",
      title: "Generator Fuel Supply Pipe Repair",
      description: "Slow leak spotted under the primary diesel generator filters. Smells strongly in courtyard.",
      propertyId: "prop_2",
      unitId: "unit_2_B",
      priority: "medium",
      status: "assigned",
      assigneeId: "tech_3",
      category: "HVAC",
      tenantNotes: "Spotted dark circles on the yard floor.",
      internalNotes: "Bring clean safety rags, extra 1.2 inch fuel hoses, and aluminum seal zip clamps.",
      createdAt: getPastDate(3),
      updatedAt: getPastDate(3)
    },

    // --- 5 COMPLETED JOBS (Closed status) ---
    {
      id: "tick_completed_1",
      title: "Water Heater Thermostat Burnout",
      description: "Water heating system in Lido Penthouse was locked at maximum cold water temperature.",
      propertyId: "prop_3",
      unitId: "unit_3_12",
      priority: "high",
      status: "closed",
      assigneeId: "tech_1",
      category: "Plumbing",
      tenantNotes: "The water was freezing cold. Thank you for fixing!",
      internalNotes: "Thermostat replaced with 240V 16A Ariston coil unit.",
      createdAt: getPastDate(120),
      updatedAt: getPastDate(96),
      completedAt: getPastDate(96),
      completionNotes: "Successfully replaced burnt Ariston thermostat coil. Sealed with silicone. Verified 50°C hot outflow."
    },
    {
      id: "tick_completed_2",
      title: "A/C Condenser Blockage Clear out",
      description: "Air conditioner is struggling on fan speed level 3, causing a vibrating rumble.",
      propertyId: "prop_1",
      unitId: "unit_1_02",
      priority: "medium",
      status: "closed",
      assigneeId: "tech_3",
      category: "HVAC",
      tenantNotes: "Air conditioning works perfectly silent now.",
      internalNotes: "Drained accumulated condensate mud. Sanitized coil plates.",
      createdAt: getPastDate(110),
      updatedAt: getPastDate(80),
      completedAt: getPastDate(80),
      completionNotes: "Removed dust-filter debris from air filters, washed outward duct, checked pressure, verified silent run."
    },
    {
      id: "tick_completed_3",
      title: "Elevated Water Tank Lid Blown Off",
      description: "Heavy winds blew the fiberglass lid off. Poses cleanliness and pollution risk.",
      propertyId: "prop_2",
      unitId: "unit_2_A",
      priority: "high",
      status: "closed",
      assigneeId: "tech_3",
      category: "Plumbing",
      tenantNotes: "Lid replaced, thank you for securing it.",
      internalNotes: "Anchored cover with extra steel wire loop straps.",
      createdAt: getPastDate(150),
      updatedAt: getPastDate(100),
      completedAt: getPastDate(100),
      completionNotes: "Returned the lid to top, tightened brackets using heavy toggle clamps, cleared sand particles."
    },
    {
      id: "tick_completed_4",
      title: "Broken Corridor Lightbulbs Replacement",
      description: "Entire second floor corridor is completely dark. Tenants using mobile flashlights at night.",
      propertyId: "prop_1",
      unitId: "unit_1_01",
      priority: "medium",
      status: "closed",
      assigneeId: "tech_2",
      category: "Electrical",
      tenantNotes: "Super bright lights are back. Much safer.",
      internalNotes: "Fitted high-efficiency LED batten lights.",
      createdAt: getPastDate(90),
      updatedAt: getPastDate(70),
      completedAt: getPastDate(70),
      completionNotes: "Replaced 4 burnt fluorescent bulbs with premium long-life Philips LED 18W bars."
    },
    {
      id: "tick_completed_5",
      title: "Kitchen Sink Drain Replacements",
      description: "U-trap pipe corroded and leaking dishwasher discharge onto floorboards.",
      propertyId: "prop_4",
      unitId: "unit_4_09",
      priority: "low",
      status: "closed",
      assigneeId: "tech_1",
      category: "Plumbing",
      tenantNotes: "The leak under my counter has fully dried out.",
      internalNotes: "Replaced plastic piping with durable Somali PVC pipe fittings.",
      createdAt: getPastDate(200),
      updatedAt: getPastDate(150),
      completedAt: getPastDate(150),
      completionNotes: "Swapped fragile U-tube bracket with a robust pressure-rated PVC model. Fully leak tested."
    }
  ];

  // 4. Historical Action Updates - Storing timestamps & actors
  database.updates = [
    {
      id: "up_1",
      ticketId: "tick_1",
      statusBefore: "assigned",
      statusAfter: "started",
      actorId: "tech_1",
      actorName: "Ahmed Shariif",
      actorRole: "technician",
      notes: "Arrived at Shabelle Residence. Discovered main supply lock jammed. Starting repair.",
      timestamp: getPastDate(6)
    },
    {
      id: "up_2",
      ticketId: "tick_2",
      statusBefore: "started",
      statusAfter: "waiting_for_parts",
      actorId: "tech_2",
      actorName: "Sahra Farax",
      actorRole: "technician",
      notes: "Exhaust fans are fully dead and internal thermistor triggers offline. Ordered replacement fans.",
      timestamp: getPastDate(24)
    },
    {
      id: "up_3",
      ticketId: "tick_4",
      statusBefore: "assigned",
      statusAfter: "started",
      actorId: "tech_3",
      actorName: "Cabdi Nuur",
      actorRole: "technician",
      notes: "Climbed outer structure to access top deck platform. Heavy wind gusts at Lido beach.",
      timestamp: getPastDate(12)
    },
    {
      id: "up_4",
      ticketId: "tick_4",
      statusBefore: "started",
      statusAfter: "paused",
      actorId: "tech_3",
      actorName: "Cabdi Nuur",
      actorRole: "technician",
      notes: "Paused due to strong dust storm risk. Safety harness and goggles are required for continuation.",
      timestamp: getPastDate(10)
    },
    {
      id: "up_5",
      ticketId: "tick_5",
      statusBefore: "assigned",
      statusAfter: "waiting_approval",
      actorId: "tech_2",
      actorName: "Sahra Farax",
      actorRole: "technician",
      notes: "Recommended stainless brackets. Standard iron brackets will degrade in less than 3 months on Lido coast. Waiting for supervisor vote.",
      timestamp: getPastDate(12)
    },
    {
      id: "up_6",
      ticketId: "tick_6",
      statusBefore: "assigned",
      statusAfter: "started",
      actorId: "tech_2",
      actorName: "Sahra Farax",
      actorRole: "technician",
      notes: "Urgent response tracking. Removed dangerous faceplate. Isolated cables.",
      timestamp: getPastDate(2)
    }
  ];

  // 5. Seeding 12 Maintenance Photos
  // To avoid failing placeholders and strictly respect reference images, we generate highly authentic, 
  // thematic SVGs as base64 URLs or real visually rich inline images. Let's make sure they load cleanly in <img> tags.
  // We can use beautifully styled, lightweight data:image/svg+xml placeholders that look like real photos with diagrams.
  const createMockPhotoSvg = (color: string, title: string, desc: string) => {
    const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="100%" height="100%" fill="${color}"/>
      <line x1="10" y1="10" x2="390" y2="290" stroke="white" stroke-width="15" stroke-opacity="0.1"/>
      <line x1="390" y1="10" x2="10" y2="290" stroke="white" stroke-width="15" stroke-opacity="0.1"/>
      <circle cx="200" cy="130" r="50" fill="none" stroke="white" stroke-width="6" stroke-opacity="0.5"/>
      <polygon points="170,160 200,100 230,160" fill="white" fill-opacity="0.3"/>
      <text x="20" y="240" font-family="monospace" font-size="22" font-weight="bold" fill="white">${title}</text>
      <text x="20" y="270" font-family="monospace" font-size="14" fill="white" fill-opacity="0.9">${desc}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(raw)}`;
  };

  database.photos = [
    {
      id: "photo_1",
      ticketId: "tick_1",
      url: createMockPhotoSvg("#c2410c", "Jammed Valve Brass Rust", "Corroded main supply pipe connection - water spray"),
      caption: "Blocked and heavily corroded main plumbing valve inside basement inlet.",
      timestamp: getPastDate(11),
      step: "before"
    },
    {
      id: "photo_2",
      ticketId: "tick_1",
      url: createMockPhotoSvg("#047857", "New Brass Pressure Valve", "High-grade 2-inch gate valve assembly installed"),
      caption: "New dual-seal Mogadishu standard water gate-valve mounted securely.",
      timestamp: getPastDate(6),
      step: "after"
    },
    {
      id: "photo_3",
      ticketId: "tick_2",
      url: createMockPhotoSvg("#7c2d12", "Burnt Inverter Board", "DC-AC transformer heat scoring observed"),
      caption: "Burnt transistors found near the rear cooling duct of the solar box.",
      timestamp: getPastDate(46),
      step: "before"
    },
    {
      id: "photo_4",
      ticketId: "tick_4",
      url: createMockPhotoSvg("#b45309", "Lido Rooftop Wind Damage", "Penthouse outer unit with shroud cover shaking"),
      caption: "AC outdoor radiator structure shaking during coastal sea winds.",
      timestamp: getPastDate(17),
      step: "before"
    },
    {
      id: "photo_5",
      ticketId: "tick_5",
      url: createMockPhotoSvg("#1e293b", "Rusted Solar Bracket", "Severe marine-grade oxidation on backing frame"),
      caption: "Extensive rust and chemical degradation on raw iron solar frame nodes.",
      timestamp: getPastDate(29),
      step: "before"
    },
    {
      id: "photo_6",
      ticketId: "tick_6",
      url: createMockPhotoSvg("#991b1b", "Burnt Outlet Socket", "Soot particles and molten copper casing inside wall"),
      caption: "Melted terminal pins showing electrical surge hazard in tenant room.",
      timestamp: getPastDate(4),
      step: "before"
    },
    {
      id: "photo_7",
      ticketId: "tick_6",
      url: createMockPhotoSvg("#15803d", "New Grounded Core Modular", "Fitted industrial grade modular outlet with switch"),
      caption: "Installed safer flame-resistant outlet socket with isolated grounding wire.",
      timestamp: getPastDate(1.5),
      step: "after"
    },
    {
      id: "photo_completed_1_b",
      ticketId: "tick_completed_1",
      url: createMockPhotoSvg("#1e1b4b", "Cold Water Tank Probe", "Faulty thermistor terminal with moisture inside"),
      caption: "Faulty thermostat with moisture bypass behind the water heater tank.",
      timestamp: getPastDate(119),
      step: "before"
    },
    {
      id: "photo_completed_1_a",
      ticketId: "tick_completed_1",
      url: createMockPhotoSvg("#166534", "Heater Hot Outflow Terminal", "AAriston controller light glowing green"),
      caption: "New water heater element wired perfectly. Outflow reads 52 degrees.",
      timestamp: getPastDate(96),
      step: "proof"
    },
    {
      id: "photo_completed_2_b",
      ticketId: "tick_completed_2",
      url: createMockPhotoSvg("#0f172a", "Dirty Filters Blocked", "Excessive grey mud in secondary evaporator plate"),
      caption: "Clogged indoor AC filter plates restricting draft before clean and wash.",
      timestamp: getPastDate(105),
      step: "before"
    },
    {
      id: "photo_completed_2_a",
      ticketId: "tick_completed_2",
      url: createMockPhotoSvg("#22c55e", "Evaporator Clean Coils", "Plates polished with deep chemical sanitization"),
      caption: "Evaporator system restored to pristine dust-free condition.",
      timestamp: getPastDate(80),
      step: "proof"
    },
    {
      id: "photo_completed_3_p",
      ticketId: "tick_completed_3",
      url: createMockPhotoSvg("#0284c7", "Secured Reservoir Guard", "Lid lashed down with dual 4mm braided lines"),
      caption: "Completed installation of heavy gauge clamps and non-slip marine ties.",
      timestamp: getPastDate(100),
      step: "proof"
    }
  ];

  // 6. Seeding 8 Cost Entries
  database.costs = [
    {
      id: "cost_1",
      ticketId: "tick_1",
      item: "Heavy Duty Brass Gate Valve 2-inch",
      quantity: 1,
      unitCost: 85.00,
      laborCost: 40.00,
      estimatedTotal: 125.00,
      finalCost: 125.00,
      approvalNeeded: false,
      status: "approved",
      createdAt: getPastDate(10)
    },
    {
      id: "cost_2",
      ticketId: "tick_2",
      item: "120V Exhaust Fan Multi-Speed DC",
      quantity: 2,
      unitCost: 35.00,
      laborCost: 50.00,
      estimatedTotal: 120.00,
      finalCost: 120.00,
      approvalNeeded: false,
      status: "approved",
      createdAt: getPastDate(45)
    },
    {
      id: "cost_3",
      ticketId: "tick_4",
      item: "Lido AC Roof Condenser Fan Motor",
      quantity: 1,
      unitCost: 175.00,
      laborCost: 90.00,
      estimatedTotal: 265.00,
      finalCost: 0,
      approvalNeeded: true,
      status: "pending", // Waiting Supervisor vote
      createdAt: getPastDate(15)
    },
    {
      id: "cost_4",
      ticketId: "tick_5",
      item: "Marine Grade Stainless-Steel Brackets L316",
      quantity: 8,
      unitCost: 15.00,
      laborCost: 60.00,
      estimatedTotal: 180.00,
      finalCost: 0,
      approvalNeeded: true,
      status: "pending",
      createdAt: getPastDate(28)
    },
    {
      id: "cost_5",
      ticketId: "tick_6",
      item: "Flame-Retardant Wall Socket Plate + Ground Wires",
      quantity: 3,
      unitCost: 12.00,
      laborCost: 25.00,
      estimatedTotal: 61.00,
      finalCost: 61.00,
      approvalNeeded: false,
      status: "approved",
      createdAt: getPastDate(3)
    },
    {
      id: "cost_completed_1",
      ticketId: "tick_completed_1",
      item: "Ariston Water Thermostat Switch Coil assembly",
      quantity: 1,
      unitCost: 45.00,
      laborCost: 30.00,
      estimatedTotal: 75.00,
      finalCost: 75.00,
      approvalNeeded: false,
      status: "approved",
      createdAt: getPastDate(118)
    },
    {
      id: "cost_completed_2",
      ticketId: "tick_completed_2",
      item: "Coil Disinfectant Chemical Cleansing Liquid",
      quantity: 2,
      unitCost: 15.00,
      laborCost: 20.00,
      estimatedTotal: 50.00,
      finalCost: 50.00,
      approvalNeeded: false,
      status: "approved",
      createdAt: getPastDate(100)
    },
    {
      id: "cost_completed_3",
      ticketId: "tick_completed_3",
      item: "Industrial Steel Clamp Straps & Wire Braces",
      quantity: 4,
      unitCost: 10.00,
      laborCost: 30.00,
      estimatedTotal: 70.00,
      finalCost: 70.00,
      approvalNeeded: false,
      status: "approved",
      createdAt: getPastDate(140)
    }
  ];
}

// Perform initial seed of database
runSeeder();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// API 1: Auth login endpoint
app.post("/api/auth/login", (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Missing login details" });
  }

  // Pre-configured validation
  const user = database.users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.role === role
  );

  // For testing, password is "123" (simple field testing)
  if (user && password === "123") {
    return res.json({ status: "success", user });
  } else {
    return res.status(401).json({ error: "Invalid username/password or incorrect role profile selected." });
  }
});

// API 2: Fetch lists with support for technician and supervisor views
app.get("/api/tickets", (req, res) => {
  const { assigneeId, propertyId, priority, status } = req.query;
  
  let result = [...database.tickets];

  // Filters
  if (assigneeId) {
    result = result.filter(t => t.assigneeId === assigneeId);
  }
  if (propertyId) {
    result = result.filter(t => t.propertyId === propertyId);
  }
  if (priority) {
    result = result.filter(t => t.priority === priority);
  }
  if (status) {
    result = result.filter(t => t.status === status);
  }

  res.json(result);
});

// API 3: Fetch ticket complete details (with updates, photos, and costs nested)
app.get("/api/tickets/:id", (req, res) => {
  const ticket = database.tickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const updates = database.updates.filter(u => u.ticketId === ticket.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const photos = database.photos.filter(p => p.ticketId === ticket.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const costs = database.costs.filter(c => c.ticketId === ticket.id);

  res.json({
    ...ticket,
    updates,
    photos,
    costs
  });
});

// API 4: Update status and append timeline history
app.post("/api/tickets/:id/status", (req, res) => {
  const { status, actorId, actorName, actorRole, notes } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: "Status value is required" });
  }

  const ticketIndex = database.tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const oldStatus = database.tickets[ticketIndex].status;
  database.tickets[ticketIndex].status = status as TicketStatus;
  database.tickets[ticketIndex].updatedAt = new Date().toISOString();

  // Log activity
  const newUpdate: MaintenanceUpdate = {
    id: "up_" + Date.now(),
    ticketId: req.params.id,
    statusBefore: oldStatus,
    statusAfter: status as TicketStatus,
    actorId: actorId || "unknown",
    actorName: actorName || "System Staff",
    actorRole: actorRole || "technician",
    notes: notes || `Militant update from ${oldStatus} to ${status}`,
    timestamp: new Date().toISOString()
  };

  database.updates.push(newUpdate);

  res.json({ 
    success: true, 
    ticket: database.tickets[ticketIndex],
    update: newUpdate
  });
});

// API 5: Add Note Endpoint (Internal / Tenant notes separate edit)
app.post("/api/tickets/:id/notes", (req, res) => {
  const { notesType, content, actorName } = req.body; // notesType: 'tenant' or 'internal'
  
  if (!content) {
    return res.status(400).json({ error: "Note content cannot be blank" });
  }

  const ticketIndex = database.tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  if (notesType === 'tenant') {
    database.tickets[ticketIndex].tenantNotes = content;
  } else {
    database.tickets[ticketIndex].internalNotes = content;
  }
  
  database.tickets[ticketIndex].updatedAt = new Date().toISOString();

  // Create a silent system log update to keep track
  const newUpdate: MaintenanceUpdate = {
    id: "up_" + Date.now(),
    ticketId: req.params.id,
    statusBefore: database.tickets[ticketIndex].status,
    statusAfter: database.tickets[ticketIndex].status,
    actorId: "system",
    actorName: actorName || "Staff Member",
    actorRole: "technician",
    notes: `Added ${notesType === 'tenant' ? 'Tenant-Facing' : 'Internal'} Note: "${content.substring(0, 30)}..."`,
    timestamp: new Date().toISOString()
  };
  database.updates.push(newUpdate);

  res.json({ success: true, ticket: database.tickets[ticketIndex] });
});

// API 6: Upload photo
app.post("/api/tickets/:id/photos", (req, res) => {
  const { url, caption, step } = req.body;
  if (!url || !step) {
    return res.status(400).json({ error: "Photo URL/base64 and step are required" });
  }

  const ticketIndex = database.tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const newPhoto: MaintenancePhoto = {
    id: "photo_" + Date.now(),
    ticketId: req.params.id,
    url,
    caption: caption || `Captured photo in ${step} stage.`,
    timestamp: new Date().toISOString(),
    step: step as 'before' | 'after' | 'proof'
  };

  database.photos.push(newPhoto);
  database.tickets[ticketIndex].updatedAt = new Date().toISOString();

  // Log to history
  database.updates.push({
    id: "up_" + Date.now(),
    ticketId: req.params.id,
    statusBefore: database.tickets[ticketIndex].status,
    statusAfter: database.tickets[ticketIndex].status,
    actorId: "uploader",
    actorName: "Field Tech",
    actorRole: "technician",
    notes: `Uploaded photo for ${step} stage: ${caption || '(No caption)'}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, photo: newPhoto });
});

// API 7: Log maintenance cost item
app.post("/api/tickets/:id/costs", (req, res) => {
  const { item, quantity, unitCost, laborCost, approvalNeeded } = req.body;
  if (!item || !quantity || unitCost === undefined || laborCost === undefined) {
    return res.status(400).json({ error: "Please supplement all cost logs parameters" });
  }

  const ticketIndex = database.tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const est = (Number(quantity) * Number(unitCost)) + Number(laborCost);
  
  const newCost: MaintenanceCost = {
    id: "cost_" + Date.now(),
    ticketId: req.params.id,
    item,
    quantity: Number(quantity),
    unitCost: Number(unitCost),
    laborCost: Number(laborCost),
    estimatedTotal: est,
    finalCost: approvalNeeded ? 0 : est, // If approval needed, wait for supervisor to sign
    approvalNeeded: !!approvalNeeded,
    status: approvalNeeded ? "pending" : "approved",
    createdAt: new Date().toISOString()
  };

  database.costs.push(newCost);
  database.tickets[ticketIndex].updatedAt = new Date().toISOString();

  // Create update history
  database.updates.push({
    id: "up_" + Date.now(),
    ticketId: req.params.id,
    statusBefore: database.tickets[ticketIndex].status,
    statusAfter: queueNextStatusForCost(database.tickets[ticketIndex].status, !!approvalNeeded),
    actorId: "account",
    actorName: "Technician Accountant",
    actorRole: "technician",
    notes: `Logged materials cost for "${item}": Est $${est.toFixed(2)}${approvalNeeded ? ' (Awaiting supervisor signoff)' : ''}`,
    timestamp: new Date().toISOString()
  });

  if (approvalNeeded) {
    database.tickets[ticketIndex].status = "waiting_approval";
  }

  res.json({ success: true, cost: newCost, ticket: database.tickets[ticketIndex] });
});

function queueNextStatusForCost(current: TicketStatus, isApprovalNeeded: boolean): TicketStatus {
  if (isApprovalNeeded) return "waiting_approval";
  return current;
}

// API 8: Cost approval (Supervisor only)
app.post("/api/costs/:costId/approve", (req, res) => {
  const { supervisorId, supervisorName } = req.body;
  
  const costIndex = database.costs.findIndex(c => c.id === req.params.costId);
  if (costIndex === -1) {
    return res.status(404).json({ error: "Cost record not found" });
  }

  database.costs[costIndex].status = "approved";
  database.costs[costIndex].finalCost = database.costs[costIndex].estimatedTotal;

  // Find ticket to restore status or update
  const ticketId = database.costs[costIndex].ticketId;
  const ticketIndex = database.tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex !== -1) {
    // If ticket was waiting for approval, check if any other pending costs exist.
    // If none, we can set status back to started/assigned or let supervisor review.
    const hasMorePending = database.costs.some(c => c.ticketId === ticketId && c.status === "pending" && c.id !== req.params.costId);
    
    if (!hasMorePending && database.tickets[ticketIndex].status === "waiting_approval") {
      database.tickets[ticketIndex].status = "started"; // resume automatically
    }

    database.updates.push({
      id: "up_" + Date.now(),
      ticketId,
      statusBefore: "waiting_approval",
      statusAfter: database.tickets[ticketIndex].status,
      actorId: supervisorId || "sup_1",
      actorName: supervisorName || "Maxamed Kaliil",
      actorRole: "supervisor",
      notes: `APPROVED cost budget of $${database.costs[costIndex].estimatedTotal.toFixed(2)} for ${database.costs[costIndex].item}`,
      timestamp: new Date().toISOString()
    });
  }

  res.json({ success: true, cost: database.costs[costIndex] });
});

// API 9: Completion workflow submissions
app.post("/api/tickets/:id/complete", (req, res) => {
  const { completionNotes, finalProofPhoto, actorId, actorName } = req.body;
  
  const ticketIndex = database.tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const oldStatus = database.tickets[ticketIndex].status;
  database.tickets[ticketIndex].status = "resolved";
  database.tickets[ticketIndex].completionNotes = completionNotes || "Repairs successfully concluded and proof provided.";
  database.tickets[ticketIndex].completedAt = new Date().toISOString();
  database.tickets[ticketIndex].updatedAt = new Date().toISOString();

  // If final proof photo is attached
  if (finalProofPhoto) {
    database.photos.push({
      id: "photo_" + Date.now(),
      ticketId: req.params.id,
      url: finalProofPhoto,
      caption: "Final proof photo uploaded during closure workflow.",
      timestamp: new Date().toISOString(),
      step: "proof"
    });
  }

  // Create update history
  const statusUpdate: MaintenanceUpdate = {
    id: "up_" + Date.now(),
    ticketId: req.params.id,
    statusBefore: oldStatus,
    statusAfter: "resolved",
    actorId: actorId || "tech_1",
    actorName: actorName || "Ahmed Shariif",
    actorRole: "technician",
    notes: `Completed job tasks. Submitting final notes: "${completionNotes?.substring(0, 40) || ''}"`,
    timestamp: new Date().toISOString()
  };

  database.updates.push(statusUpdate);

  res.json({ success: true, ticket: database.tickets[ticketIndex] });
});

// API 10: Close ticket (Supervisor action)
app.post("/api/tickets/:id/close", (req, res) => {
  const { supervisorId, supervisorName } = req.body;
  
  const ticketIndex = database.tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const oldStatus = database.tickets[ticketIndex].status;
  database.tickets[ticketIndex].status = "closed";
  database.tickets[ticketIndex].updatedAt = new Date().toISOString();

  // Create update history
  database.updates.push({
    id: "up_" + Date.now(),
    ticketId: req.params.id,
    statusBefore: oldStatus,
    statusAfter: "closed",
    actorId: supervisorId || "sup_1",
    actorName: supervisorName || "Maxamed Kaliil",
    actorRole: "supervisor",
    notes: "Supervisor inspected workmanship, approved cost ledger, and archived work order.",
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, ticket: database.tickets[ticketIndex] });
});

// API 11: System reset seeder trigger
app.post("/api/admin/reset", (req, res) => {
  runSeeder();
  res.json({ success: true, message: "Database reset to rich Somali default MVP dataset." });
});

// API 12: Properties listing helpers
app.get("/api/properties", (req, res) => {
  res.json(database.properties);
});

// API 13: Units helper
app.get("/api/properties/:id/units", (req, res) => {
  res.json(database.units.filter(u => u.propertyId === req.params.id));
});

// Static properties lookup endpoint
app.get("/api/static/properties", (req, res) => {
  res.json(database.properties);
});

app.get("/api/static/units", (req, res) => {
  res.json(database.units);
});

// Return reports statistics summary
app.get("/api/reports/statistics", (req, res) => {
  // Aggregate data and calculations
  const totalTickets = database.tickets.length;
  const activeTickets = database.tickets.filter(t => t.status !== "closed" && t.status !== "resolved").length;
  const completedCount = database.tickets.filter(t => t.status === "closed" || t.status === "resolved").length;

  const totalSpend = database.costs
    .reduce((sum, c) => sum + Number(c.finalCost), 0);

  const materialsCost = database.costs
    .reduce((sum, c) => sum + (Number(c.quantity) * Number(c.unitCost)), 0);

  const laborCostTotal = database.costs
    .reduce((sum, c) => sum + Number(c.laborCost), 0);

  const outstandingApprovalsCount = database.costs
    .filter(c => c.status === "pending").length;

  // Breakdown by priority
  const priorityDistribution = {
    low: database.tickets.filter(t => t.priority === "low").length,
    medium: database.tickets.filter(t => t.priority === "medium").length,
    high: database.tickets.filter(t => t.priority === "high").length,
    urgent: database.tickets.filter(t => t.priority === "urgent").length,
  };

  // Spend by property
  const propertySpend = database.properties.map(p => {
    const ticketIdsForProperty = database.tickets.filter(t => t.propertyId === p.id).map(t => t.id);
    const spend = database.costs
      .filter(c => ticketIdsForProperty.includes(c.ticketId))
      .reduce((sum, c) => sum + Number(c.finalCost), 0);
    return {
      propertyId: p.id,
      propertyName: p.name,
      district: p.district,
      spend
    };
  });

  res.json({
    totalTickets,
    activeTickets,
    completedCount,
    totalSpend,
    materialsCost,
    laborCostTotal,
    outstandingApprovalsCount,
    priorityDistribution,
    propertySpend
  });
});

// Serve frontend application assets
async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SomRent Fix Multi-User Server running on: http://localhost:${PORT}`);
  });
}

serveApp();
