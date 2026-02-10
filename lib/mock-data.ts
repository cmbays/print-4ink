import type { Customer } from "./schemas/customer";
import type { Contact } from "./schemas/contact";
import type { Group } from "./schemas/group";
import type { Note } from "./schemas/note";
import type { Address } from "./schemas/address";
import type { Job } from "./schemas/job";
import type { Quote } from "./schemas/quote";
import type { Screen } from "./schemas/screen";
import type { Color } from "./schemas/color";
import type { GarmentCatalog } from "./schemas/garment";
import type { Artwork } from "./schemas/artwork";

// ---------------------------------------------------------------------------
// Customer IDs (stable — referenced by jobs, quotes, artworks)
// ---------------------------------------------------------------------------

const CUSTOMER_IDS = {
  riverCity: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  lonestar: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
  thompson: "e3c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e",
  sunset5k: "f4d5e6f7-a8b9-4c0d-8e2f-3a4b5c6d7e8f",
  lakeside: "a5e6f7a8-b9c0-4d1e-9f3a-4b5c6d7e8f9a",
  metroYouth: "b6f7a8b9-c0d1-4e2f-9a4b-5c6d7e8f9a0b",
  tiktokMerch: "c7a8b9c0-d1e2-4f3a-ab5c-6d7e8f9a0b1c",
  riverside: "d8b9c0d1-e2f3-4a4b-bc6d-7e8f9a0b1c2d",
  crosstown: "e9c0d1e2-f3a4-4b5c-8d7e-9f0a1b2c3d4e",
  mountainView: "f0d1e2f3-a4b5-4c6d-9e8f-0a1b2c3d4e5f",
} as const;

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export const contacts: Contact[] = [
  // River City Brewing — 2 contacts, 1 group
  { id: "01a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c", name: "Marcus Rivera", email: "marcus@rivercitybrewing.com", phone: "(512) 555-0147", role: "ordering", isPrimary: true, groupId: "91a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c" },
  { id: "02b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d", name: "Lisa Park", email: "lisa@rivercitybrewing.com", role: "art-approver", isPrimary: false, groupId: "91a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c" },
  // Lonestar Lacrosse — 1 contact
  { id: "03c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e", name: "Sarah Chen", email: "sarah@lonestarlax.org", phone: "(512) 555-0298", role: "ordering", isPrimary: true },
  // Thompson Family — 1 contact
  { id: "04d5e6f7-a8b9-4c0d-ae2f-3a4b5c6d7e8f", name: "Jake Thompson", email: "jake.thompson@gmail.com", phone: "(737) 555-0412", role: "ordering", isPrimary: true },
  // Sunset 5K — 1 contact
  { id: "05e6f7a8-b9c0-4d1e-bf3a-4b5c6d7e8f9a", name: "Maria Gonzalez", email: "maria@sunset5k.org", phone: "(512) 555-0533", role: "ordering", isPrimary: true },
  // Lakeside Music Festival — 2 contacts
  { id: "06f7a8b9-c0d1-4e2f-8a4b-5c6d7e8f9a0b", name: "Chris Patel", email: "chris@lakesidefest.com", phone: "(737) 555-0671", role: "ordering", isPrimary: true },
  { id: "07a8b9c0-d1e2-4f3a-9b5c-6d7e8f9a0b1c", name: "Amy Wong", email: "amy@lakesidefest.com", phone: "(737) 555-0672", role: "billing", isPrimary: false },
  // Metro Youth Soccer — 2 contacts, 1 group
  { id: "08b9c0d1-e2f3-4a4b-ac6d-7e8f9a0b1c2d", name: "Coach Williams", email: "coach@metroyouthsoccer.org", phone: "(512) 555-0801", role: "ordering", isPrimary: true, groupId: "92b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d" },
  { id: "09c0d1e2-f3a4-4b5c-bd7e-8f9a0b1c2d3e", name: "Janet Lee", email: "janet@metroyouthsoccer.org", phone: "(512) 555-0802", role: "billing", isPrimary: false, groupId: "92b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d" },
  // TikTok Merch Co — 1 contact
  { id: "10d1e2f3-a4b5-4c6d-8e8f-9a0b1c2d3e4f", name: "Alex Kim", email: "alex@tiktokmerch.co", phone: "(737) 555-0910", role: "owner", isPrimary: true },
  // Riverside Church — 1 contact
  { id: "11e2f3a4-b5c6-4d7e-9f0a-1b2c3d4e5f6a", name: "Pastor James", email: "pastor.james@riversidechurch.org", phone: "(512) 555-1101", role: "ordering", isPrimary: true },
  // CrossTown Printing — 1 contact
  { id: "12f3a4b5-c6d7-4e8f-a01b-2c3d4e5f6a7b", name: "Mike Davis", email: "mike@crosstownprinting.com", phone: "(512) 555-1201", role: "owner", isPrimary: true },
  // Mountain View HS — 1 contact
  { id: "13a4b5c6-d7e8-4f9a-b12c-3d4e5f6a7b8c", name: "Tom Rodriguez", email: "t.rodriguez@mvhs.edu", phone: "(737) 555-1301", role: "ordering", isPrimary: true, notes: "Athletic Director" },
];

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export const customerGroups: Group[] = [
  { id: "91a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c", name: "Marketing Dept", customerId: CUSTOMER_IDS.riverCity },
  { id: "92b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d", name: "Admin", customerId: CUSTOMER_IDS.metroYouth },
];

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export const customerAddresses: Address[] = [
  // River City Brewing
  { id: "31a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c", label: "Main", street: "1200 E 6th St", city: "Austin", state: "TX", zip: "78702", country: "US", isDefault: true, type: "billing" },
  { id: "32b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d", label: "Taproom", street: "1200 E 6th St", city: "Austin", state: "TX", zip: "78702", country: "US", isDefault: true, type: "shipping" },
  { id: "33c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e", label: "Warehouse", street: "3400 Industrial Blvd", city: "Austin", state: "TX", zip: "78745", country: "US", isDefault: false, type: "shipping" },
  // Lonestar Lacrosse
  { id: "34d5e6f7-a8b9-4c0d-ae2f-3a4b5c6d7e8f", label: "Office", street: "4500 Mueller Blvd", city: "Austin", state: "TX", zip: "78723", country: "US", isDefault: true, type: "billing" },
  { id: "35e6f7a8-b9c0-4d1e-bf3a-4b5c6d7e8f9a", label: "Fields", street: "4500 Mueller Blvd", city: "Austin", state: "TX", zip: "78723", country: "US", isDefault: true, type: "shipping" },
  // Thompson Family
  { id: "36f7a8b9-c0d1-4e2f-8a4b-5c6d7e8f9a0b", label: "Home", street: "789 Live Oak Dr", city: "Round Rock", state: "TX", zip: "78664", country: "US", isDefault: true, type: "billing" },
  { id: "37a8b9c0-d1e2-4f3a-9b5c-6d7e8f9a0b1c", label: "Home", street: "789 Live Oak Dr", city: "Round Rock", state: "TX", zip: "78664", country: "US", isDefault: true, type: "shipping" },
  // Sunset 5K
  { id: "38b9c0d1-e2f3-4a4b-ac6d-7e8f9a0b1c2d", label: "Office", street: "2100 Barton Springs Rd", city: "Austin", state: "TX", zip: "78704", country: "US", isDefault: true, type: "billing" },
  // Lakeside Music Festival
  { id: "39c0d1e2-f3a4-4b5c-bd7e-8f9a0b1c2d3e", label: "Office", street: "500 E Cesar Chavez", city: "Austin", state: "TX", zip: "78701", country: "US", isDefault: true, type: "billing" },
  { id: "40d1e2f3-a4b5-4c6d-8e8f-9a0b1c2d3e4f", label: "Festival Grounds", street: "2100 S Lakeshore Blvd", city: "Austin", state: "TX", zip: "78741", country: "US", isDefault: true, type: "shipping" },
  // Metro Youth Soccer
  { id: "41e2f3a4-b5c6-4d7e-9f0a-1b2c3d4e5f6a", label: "Office", street: "8200 N Lamar Blvd", city: "Austin", state: "TX", zip: "78753", country: "US", isDefault: true, type: "billing" },
  { id: "42f3a4b5-c6d7-4e8f-a01b-2c3d4e5f6a7b", label: "Fields", street: "8200 N Lamar Blvd", city: "Austin", state: "TX", zip: "78753", country: "US", isDefault: true, type: "shipping" },
  // TikTok Merch Co
  { id: "43a4b5c6-d7e8-4f9a-b12c-3d4e5f6a7b8c", label: "Studio", street: "1100 S Congress Ave", city: "Austin", state: "TX", zip: "78704", country: "US", isDefault: true, type: "billing" },
  { id: "44b5c6d7-e8f9-4a0b-812c-3d4e5f6a7b8c", label: "Studio", street: "1100 S Congress Ave", city: "Austin", state: "TX", zip: "78704", country: "US", isDefault: true, type: "shipping" },
  // Riverside Church
  { id: "45c6d7e8-f9a0-4b1c-923d-4e5f6a7b8c9d", label: "Church", street: "600 W Riverside Dr", city: "Austin", state: "TX", zip: "78704", country: "US", isDefault: true, type: "billing" },
  { id: "46d7e8f9-a0b1-4c2d-a34e-5f6a7b8c9d0e", label: "Church", street: "600 W Riverside Dr", city: "Austin", state: "TX", zip: "78704", country: "US", isDefault: true, type: "shipping" },
  // CrossTown Printing
  { id: "47e8f9a0-b1c2-4d3e-b45f-6a7b8c9d0e1f", label: "Shop", street: "2200 Airport Blvd", city: "Austin", state: "TX", zip: "78722", country: "US", isDefault: true, type: "billing" },
  { id: "48f9a0b1-c2d3-4e4f-860a-7b8c9d0e1f2a", label: "Shop", street: "2200 Airport Blvd", city: "Austin", state: "TX", zip: "78722", country: "US", isDefault: true, type: "shipping" },
  // Mountain View HS
  { id: "49a0b1c2-d3e4-4f5a-971b-8c9d0e1f2a3b", label: "School", street: "5300 Mountain View Dr", city: "Cedar Park", state: "TX", zip: "78613", country: "US", isDefault: true, type: "billing" },
  { id: "50b1c2d3-e4f5-4a6b-a82c-9d0e1f2a3b4c", label: "Athletics", street: "5300 Mountain View Dr", city: "Cedar Park", state: "TX", zip: "78613", country: "US", isDefault: true, type: "shipping" },
];

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export const customerNotes: Note[] = [
  // River City Brewing — 3 notes (1 pinned)
  { id: "61a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c", content: "Prefers Comfort Colors for all casual wear. Always wants black or forest green.", createdAt: "2025-10-15T14:30:00Z", createdBy: "Gary", isPinned: true, channel: "in-person", entityType: "customer", entityId: CUSTOMER_IDS.riverCity },
  { id: "62b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d", content: "Marcus called about spring order. Wants same design as last year but with updated date.", createdAt: "2026-01-20T09:15:00Z", createdBy: "Gary", isPinned: false, channel: "phone", entityType: "customer", entityId: CUSTOMER_IDS.riverCity },
  { id: "63c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e", content: "Referred Jake Thompson — family reunion order.", createdAt: "2026-01-25T11:00:00Z", createdBy: "Gary", isPinned: false, channel: "email", entityType: "customer", entityId: CUSTOMER_IDS.riverCity },
  // Lonestar Lacrosse — 2 notes (1 pinned)
  { id: "64d5e6f7-a8b9-4c0d-ae2f-3a4b5c6d7e8f", content: "Tax exempt — certificate on file, expires 2027-03-31. Net 30 payment terms per contract.", createdAt: "2025-06-01T10:00:00Z", createdBy: "Gary", isPinned: true, channel: null, entityType: "customer", entityId: CUSTOMER_IDS.lonestar },
  { id: "65e6f7a8-b9c0-4d1e-bf3a-4b5c6d7e8f9a", content: "Sarah confirmed tournament dates for Feb 22. Rush delivery needed by Feb 20.", createdAt: "2026-02-01T15:00:00Z", createdBy: "Gary", isPinned: false, channel: "phone", entityType: "customer", entityId: CUSTOMER_IDS.lonestar },
  // Thompson Family — 2 notes (1 pinned)
  { id: "66f7a8b9-c0d1-4e2f-8a4b-5c6d7e8f9a0b", content: "One-time order — family reunion. Referred by Marcus Rivera at River City Brewing.", createdAt: "2026-02-05T09:00:00Z", createdBy: "Gary", isPinned: true, channel: null, entityType: "customer", entityId: CUSTOMER_IDS.thompson },
  { id: "67a8b9c0-d1e2-4f3a-9b5c-6d7e8f9a0b1c", content: "Jake approved the design over email. Wants youth sizes included.", createdAt: "2026-02-06T11:00:00Z", createdBy: "Gary", isPinned: false, channel: "email", entityType: "customer", entityId: CUSTOMER_IDS.thompson },
  // Sunset 5K — 2 notes (1 pinned)
  { id: "68b9c0d1-e2f3-4a4b-ac6d-7e8f9a0b1c2d", content: "Budget-conscious — declined first quote at $4,500. Try to keep under $3,000.", createdAt: "2026-01-30T16:30:00Z", createdBy: "Gary", isPinned: true, channel: null, entityType: "customer", entityId: CUSTOMER_IDS.sunset5k },
  { id: "69c0d1e2-f3a4-4b5c-bd7e-8f9a0b1c2d3e", content: "Maria asked about 1-color option to reduce cost. Sent revised quote.", createdAt: "2026-01-31T10:00:00Z", createdBy: "Gary", isPinned: false, channel: "phone", entityType: "customer", entityId: CUSTOMER_IDS.sunset5k },
  // Lakeside Music Festival — 2 notes (1 pinned)
  { id: "70d1e2f3-a4b5-4c6d-8e8f-9a0b1c2d3e4f", content: "Chris is the main decision-maker. Amy handles all billing. Always reach Chris first for creative decisions.", createdAt: "2025-09-10T14:00:00Z", createdBy: "Gary", isPinned: true, channel: "in-person", entityType: "customer", entityId: CUSTOMER_IDS.lakeside },
  { id: "71e2f3a4-b5c6-4d7e-9f0a-1b2c3d4e5f6a", content: "Haven't heard from Chris in a while. Last order was October. Should follow up about spring festival merch.", createdAt: "2026-02-05T08:30:00Z", createdBy: "Gary", isPinned: false, channel: null, entityType: "customer", entityId: CUSTOMER_IDS.lakeside },
  // Metro Youth Soccer — 2 notes (1 pinned)
  { id: "72f3a4b5-c6d7-4e8f-a01b-2c3d4e5f6a7b", content: "Seasonal orders: spring jerseys (Feb-Mar) and fall tournament gear (Aug-Sep). Tax exempt — school district.", createdAt: "2025-08-01T09:00:00Z", createdBy: "Gary", isPinned: true, channel: null, entityType: "customer", entityId: CUSTOMER_IDS.metroYouth },
  { id: "73a4b5c6-d7e8-4f9a-b12c-3d4e5f6a7b8c", content: "Coach Williams prefers to text for quick questions. Janet handles all POs and invoicing.", createdAt: "2025-09-15T11:00:00Z", createdBy: "Gary", isPinned: false, channel: "text", entityType: "customer", entityId: CUSTOMER_IDS.metroYouth },
  // TikTok Merch Co — 2 notes (1 pinned)
  { id: "74b5c6d7-e8f9-4a0b-812c-3d4e5f6a7b8c", content: "Storefront customer — has online merch store. Fast turnaround is critical for trending content.", createdAt: "2025-11-01T10:00:00Z", createdBy: "Gary", isPinned: true, channel: null, entityType: "customer", entityId: CUSTOMER_IDS.tiktokMerch },
  { id: "75c6d7e8-f9a0-4b1c-923d-4e5f6a7b8c9d", content: "Alex wants to explore DTF for small batch runs. Schedule a sample session.", createdAt: "2026-01-15T14:00:00Z", createdBy: "Gary", isPinned: false, channel: "social", entityType: "customer", entityId: CUSTOMER_IDS.tiktokMerch },
  // Riverside Church — 2 notes (1 pinned)
  { id: "76d7e8f9-a0b1-4c2d-a34e-5f6a7b8c9d0e", content: "Referred by Lonestar Lacrosse (Sarah Chen). First order — VBS t-shirts.", createdAt: "2026-01-20T10:00:00Z", createdBy: "Gary", isPinned: true, channel: null, entityType: "customer", entityId: CUSTOMER_IDS.riverside },
  { id: "77e8f9a0-b1c2-4d3e-b45f-6a7b8c9d0e1f", content: "Pastor James mentioned they do 3-4 events per year. Could become a repeat customer.", createdAt: "2026-02-01T11:30:00Z", createdBy: "Gary", isPinned: false, channel: "phone", entityType: "customer", entityId: CUSTOMER_IDS.riverside },
  // CrossTown Printing — 2 notes (1 pinned)
  { id: "78f9a0b1-c2d3-4e4f-860a-7b8c9d0e1f2a", content: "Wholesale account — another print shop. Contract pricing at 15% off. Overflow work for their large orders.", createdAt: "2025-05-01T09:00:00Z", createdBy: "Gary", isPinned: true, channel: null, entityType: "customer", entityId: CUSTOMER_IDS.crosstown },
  { id: "79a0b1c2-d3e4-4f5a-971b-8c9d0e1f2a3b", content: "Mike sends work our way when they're at capacity. Good relationship — reliable payment.", createdAt: "2025-12-10T15:00:00Z", createdBy: "Gary", isPinned: false, channel: "in-person", entityType: "customer", entityId: CUSTOMER_IDS.crosstown },
  // Mountain View HS — 2 notes (1 pinned)
  { id: "80b1c2d3-e4f5-4a6b-a82c-9d0e1f2a3b4c", content: "Athletic director exploring new vendors. Currently uses a competitor. Tax exempt — ISD.", createdAt: "2026-02-03T09:00:00Z", createdBy: "Gary", isPinned: true, channel: null, entityType: "customer", entityId: CUSTOMER_IDS.mountainView },
  { id: "81c2d3e4-f5a6-4b7c-b93d-0e1f2a3b4c5d", content: "Tom requested a sample quote for spring sports. Baseball and track teams.", createdAt: "2026-02-07T14:00:00Z", createdBy: "Gary", isPinned: false, channel: "email", entityType: "customer", entityId: CUSTOMER_IDS.mountainView },
];

// ---------------------------------------------------------------------------
// Customers (10 — expanded with full schema)
// ---------------------------------------------------------------------------

export const customers: Customer[] = [
  // 1. River City Brewing Co. — Repeat, Active, Retail, 2 referrals
  {
    id: CUSTOMER_IDS.riverCity,
    company: "River City Brewing Co.",
    name: "Marcus Rivera",
    email: "marcus@rivercitybrewing.com",
    phone: "(512) 555-0147",
    address: "1200 E 6th St, Austin, TX 78702",
    tag: "repeat",
    lifecycleStage: "repeat",
    healthStatus: "active",
    isArchived: false,
    typeTags: ["retail"],
    contacts: [contacts[0], contacts[1]],
    groups: [customerGroups[0]],
    billingAddress: customerAddresses[0],
    shippingAddresses: [customerAddresses[1], customerAddresses[2]],
    paymentTerms: "upfront",
    pricingTier: "preferred",
    discountPercentage: 5,
    taxExempt: false,
    createdAt: "2025-08-15T10:00:00Z",
    updatedAt: "2026-02-07T16:00:00Z",
  },
  // 2. Lonestar Lacrosse League — Contract, Active, Sports/School, Tax exempt
  {
    id: CUSTOMER_IDS.lonestar,
    company: "Lonestar Lacrosse League",
    name: "Sarah Chen",
    email: "sarah@lonestarlax.org",
    phone: "(512) 555-0298",
    address: "4500 Mueller Blvd, Austin, TX 78723",
    tag: "contract",
    lifecycleStage: "contract",
    healthStatus: "active",
    isArchived: false,
    typeTags: ["sports-school"],
    contacts: [contacts[2]],
    groups: [],
    billingAddress: customerAddresses[3],
    shippingAddresses: [customerAddresses[4]],
    paymentTerms: "net-30",
    pricingTier: "contract",
    discountPercentage: 10,
    taxExempt: true,
    taxExemptCertExpiry: "2027-03-31T00:00:00Z",
    createdAt: "2025-06-01T08:00:00Z",
    updatedAt: "2026-02-02T09:00:00Z",
  },
  // 3. Thompson Family Reunion 2026 — New, Active, Retail, referred by River City
  {
    id: CUSTOMER_IDS.thompson,
    company: "Thompson Family Reunion 2026",
    name: "Jake Thompson",
    email: "jake.thompson@gmail.com",
    phone: "(737) 555-0412",
    address: "789 Live Oak Dr, Round Rock, TX 78664",
    tag: "new",
    lifecycleStage: "new",
    healthStatus: "active",
    isArchived: false,
    typeTags: ["retail"],
    contacts: [contacts[3]],
    groups: [],
    billingAddress: customerAddresses[5],
    shippingAddresses: [customerAddresses[6]],
    paymentTerms: "upfront",
    pricingTier: "standard",
    taxExempt: false,
    referredByCustomerId: CUSTOMER_IDS.riverCity,
    createdAt: "2026-02-05T09:15:00Z",
    updatedAt: "2026-02-06T11:30:00Z",
  },
  // 4. Sunset 5K Run — Prospect, Active, Retail (has quote, no order)
  {
    id: CUSTOMER_IDS.sunset5k,
    company: "Sunset 5K Run",
    name: "Maria Gonzalez",
    email: "maria@sunset5k.org",
    phone: "(512) 555-0533",
    address: "2100 Barton Springs Rd, Austin, TX 78704",
    tag: "new",
    lifecycleStage: "prospect",
    healthStatus: "active",
    isArchived: false,
    typeTags: ["retail"],
    contacts: [contacts[4]],
    groups: [],
    billingAddress: customerAddresses[7],
    shippingAddresses: [],
    paymentTerms: "upfront",
    pricingTier: "standard",
    taxExempt: false,
    createdAt: "2026-01-28T08:00:00Z",
    updatedAt: "2026-01-30T16:00:00Z",
  },
  // 5. Lakeside Music Festival — Repeat, Potentially Churning, Corporate
  {
    id: CUSTOMER_IDS.lakeside,
    company: "Lakeside Music Festival",
    name: "Chris Patel",
    email: "chris@lakesidefest.com",
    phone: "(737) 555-0671",
    address: "500 E Cesar Chavez, Austin, TX 78701",
    tag: "repeat",
    lifecycleStage: "repeat",
    healthStatus: "potentially-churning",
    isArchived: false,
    typeTags: ["corporate"],
    contacts: [contacts[5], contacts[6]],
    groups: [],
    billingAddress: customerAddresses[8],
    shippingAddresses: [customerAddresses[9]],
    paymentTerms: "net-15",
    pricingTier: "preferred",
    taxExempt: false,
    createdAt: "2025-09-01T12:00:00Z",
    updatedAt: "2026-02-04T15:45:00Z",
  },
  // 6. Metro Youth Soccer — Contract, Active, Sports/School, Tax exempt, seasonal
  {
    id: CUSTOMER_IDS.metroYouth,
    company: "Metro Youth Soccer",
    name: "Coach Williams",
    email: "coach@metroyouthsoccer.org",
    phone: "(512) 555-0801",
    address: "8200 N Lamar Blvd, Austin, TX 78753",
    tag: "contract",
    lifecycleStage: "contract",
    healthStatus: "active",
    isArchived: false,
    typeTags: ["sports-school"],
    contacts: [contacts[7], contacts[8]],
    groups: [customerGroups[1]],
    billingAddress: customerAddresses[10],
    shippingAddresses: [customerAddresses[11]],
    paymentTerms: "net-30",
    pricingTier: "contract",
    discountPercentage: 8,
    taxExempt: true,
    taxExemptCertExpiry: "2027-08-31T00:00:00Z",
    createdAt: "2025-08-01T09:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  // 7. TikTok Merch Co. — Repeat, Active, Storefront/Merch + Retail
  {
    id: CUSTOMER_IDS.tiktokMerch,
    company: "TikTok Merch Co.",
    name: "Alex Kim",
    email: "alex@tiktokmerch.co",
    phone: "(737) 555-0910",
    address: "1100 S Congress Ave, Austin, TX 78704",
    tag: "repeat",
    lifecycleStage: "repeat",
    healthStatus: "active",
    isArchived: false,
    typeTags: ["storefront-merch", "retail"],
    contacts: [contacts[9]],
    groups: [],
    billingAddress: customerAddresses[12],
    shippingAddresses: [customerAddresses[13]],
    paymentTerms: "upfront",
    pricingTier: "preferred",
    discountPercentage: 5,
    taxExempt: false,
    createdAt: "2025-11-01T10:00:00Z",
    updatedAt: "2026-01-15T14:00:00Z",
  },
  // 8. Riverside Church — New, Active, Retail, referred by Lonestar
  {
    id: CUSTOMER_IDS.riverside,
    company: "Riverside Church",
    name: "Pastor James",
    email: "pastor.james@riversidechurch.org",
    phone: "(512) 555-1101",
    address: "600 W Riverside Dr, Austin, TX 78704",
    tag: "new",
    lifecycleStage: "new",
    healthStatus: "active",
    isArchived: false,
    typeTags: ["retail"],
    contacts: [contacts[10]],
    groups: [],
    billingAddress: customerAddresses[14],
    shippingAddresses: [customerAddresses[15]],
    paymentTerms: "upfront",
    pricingTier: "standard",
    taxExempt: false,
    referredByCustomerId: CUSTOMER_IDS.lonestar,
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-02-01T11:30:00Z",
  },
  // 9. CrossTown Printing — Contract, Active, Wholesale
  {
    id: CUSTOMER_IDS.crosstown,
    company: "CrossTown Printing",
    name: "Mike Davis",
    email: "mike@crosstownprinting.com",
    phone: "(512) 555-1201",
    address: "2200 Airport Blvd, Austin, TX 78722",
    tag: "contract",
    lifecycleStage: "contract",
    healthStatus: "active",
    isArchived: false,
    typeTags: ["wholesale"],
    contacts: [contacts[11]],
    groups: [],
    billingAddress: customerAddresses[16],
    shippingAddresses: [customerAddresses[17]],
    paymentTerms: "net-30",
    pricingTier: "wholesale",
    discountPercentage: 15,
    taxExempt: false,
    createdAt: "2025-05-01T09:00:00Z",
    updatedAt: "2025-12-10T15:00:00Z",
  },
  // 10. Mountain View HS — Prospect, Active, Sports/School, Tax exempt
  {
    id: CUSTOMER_IDS.mountainView,
    company: "Mountain View HS",
    name: "Tom Rodriguez",
    email: "t.rodriguez@mvhs.edu",
    phone: "(737) 555-1301",
    address: "5300 Mountain View Dr, Cedar Park, TX 78613",
    tag: "new",
    lifecycleStage: "prospect",
    healthStatus: "active",
    isArchived: false,
    typeTags: ["sports-school"],
    contacts: [contacts[12]],
    groups: [],
    billingAddress: customerAddresses[18],
    shippingAddresses: [customerAddresses[19]],
    paymentTerms: "net-30",
    pricingTier: "standard",
    taxExempt: true,
    taxExemptCertExpiry: "2027-06-30T00:00:00Z",
    createdAt: "2026-02-03T09:00:00Z",
    updatedAt: "2026-02-07T14:00:00Z",
  },
];

export const jobs: Job[] = [
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    jobNumber: "J-1024",
    title: "River City Staff Tees — Spring 2026",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    status: "press",
    priority: "high",
    dueDate: "2026-02-14",
    garments: [
      {
        sku: "G500-BLK",
        style: "Gildan 5000",
        brand: "Gildan",
        color: "Black",
        sizes: { S: 5, M: 15, L: 20, XL: 10 },
      },
    ],
    printLocations: [
      { position: "Front Center", colorCount: 3, artworkApproved: true },
      { position: "Back Full", colorCount: 2, artworkApproved: true },
    ],
  },
  {
    id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    jobNumber: "J-1025",
    title: "Lonestar Lacrosse Tournament Jerseys",
    customerId: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    status: "approval",
    priority: "rush",
    dueDate: "2026-02-10",
    garments: [
      {
        sku: "NB-DRY-WHT",
        style: "New Balance Dry Fit",
        brand: "New Balance",
        color: "White",
        sizes: { S: 8, M: 20, L: 25, XL: 12 },
      },
      {
        sku: "NB-DRY-NVY",
        style: "New Balance Dry Fit",
        brand: "New Balance",
        color: "Navy",
        sizes: { S: 8, M: 20, L: 25, XL: 12 },
      },
    ],
    printLocations: [
      { position: "Front Left Chest", colorCount: 2, artworkApproved: false },
      { position: "Back Number", colorCount: 1, artworkApproved: true },
      { position: "Left Sleeve", colorCount: 1, artworkApproved: false },
    ],
  },
  {
    id: "c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f",
    jobNumber: "J-1026",
    title: "Thompson Family Reunion Tees",
    customerId: "e3c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e",
    status: "design",
    priority: "low",
    dueDate: "2026-03-15",
    garments: [
      {
        sku: "BC3001-HTR",
        style: "Bella+Canvas 3001",
        brand: "Bella+Canvas",
        color: "Heather Grey",
        sizes: { YM: 5, YL: 5, S: 10, M: 15, L: 15, XL: 10, "2XL": 5 },
      },
    ],
    printLocations: [
      { position: "Front Center", colorCount: 4, artworkApproved: false },
    ],
  },
  {
    id: "d4e5f6a7-b8c9-4d0e-9f2a-3b4c5d6e7f8a",
    jobNumber: "J-1027",
    title: "River City Brewing — Pint Night Promo",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    status: "burning",
    priority: "medium",
    dueDate: "2026-02-20",
    garments: [
      {
        sku: "AS1301-BLK",
        style: "AS Colour 1301",
        brand: "AS Colour",
        color: "Black",
        sizes: { S: 10, M: 20, L: 20, XL: 10 },
      },
    ],
    printLocations: [
      { position: "Front Center", colorCount: 2, artworkApproved: true },
    ],
  },
  {
    id: "e5f6a7b8-c9d0-4e1f-aa3b-4c5d6e7f8a9b",
    jobNumber: "J-1028",
    title: "Lonestar Lax — Coach Polos",
    customerId: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    status: "finishing",
    priority: "medium",
    dueDate: "2026-02-08",
    garments: [
      {
        sku: "K500-NVY",
        style: "Port Authority K500",
        brand: "Port Authority",
        color: "Navy",
        sizes: { M: 4, L: 6, XL: 4 },
      },
    ],
    printLocations: [
      { position: "Left Chest", colorCount: 1, artworkApproved: true },
    ],
  },
  {
    id: "f6a7b8c9-d0e1-4f2a-bb4c-5d6e7f8a9b0c",
    jobNumber: "J-1022",
    title: "River City Brewing — Holiday Merch",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    status: "shipped",
    priority: "high",
    dueDate: "2025-12-20",
    garments: [
      {
        sku: "G185-FGR",
        style: "Gildan 18500 Hoodie",
        brand: "Gildan",
        color: "Forest Green",
        sizes: { S: 8, M: 15, L: 15, XL: 10, "2XL": 5 },
      },
    ],
    printLocations: [
      { position: "Front Center", colorCount: 3, artworkApproved: true },
      { position: "Back Full", colorCount: 3, artworkApproved: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Colors — mirrors S&S Activewear color catalog shape
// ---------------------------------------------------------------------------

export const colors: Color[] = [
  // Black family
  { id: "clr-black", name: "Black", hex: "#000000", swatchTextColor: "#FFFFFF", family: "Black", isFavorite: true },
  { id: "clr-charcoal", name: "Charcoal", hex: "#36454F", swatchTextColor: "#FFFFFF", family: "Black" },
  { id: "clr-dark-heather", name: "Dark Heather", hex: "#414a4c", swatchTextColor: "#FFFFFF", family: "Black" },

  // White family
  { id: "clr-white", name: "White", hex: "#FFFFFF", swatchTextColor: "#000000", family: "White", isFavorite: true },
  { id: "clr-natural", name: "Natural", hex: "#F5F0E1", swatchTextColor: "#000000", family: "White" },
  { id: "clr-ice-grey", name: "Ice Grey", hex: "#C4C8CB", swatchTextColor: "#000000", family: "White" },

  // Gray family
  { id: "clr-sport-grey", name: "Sport Grey", hex: "#97999B", swatchTextColor: "#000000", family: "Gray" },
  { id: "clr-heather-grey", name: "Heather Grey", hex: "#B2BEB5", swatchTextColor: "#000000", family: "Gray" },
  { id: "clr-graphite-heather", name: "Graphite Heather", hex: "#5B5B5B", swatchTextColor: "#FFFFFF", family: "Gray" },
  { id: "clr-ash", name: "Ash", hex: "#B2BEB5", swatchTextColor: "#000000", family: "Gray" },

  // Blue family
  { id: "clr-navy", name: "Navy", hex: "#1B2A4A", swatchTextColor: "#FFFFFF", family: "Blue", isFavorite: true },
  { id: "clr-royal", name: "Royal Blue", hex: "#2B5FD4", swatchTextColor: "#FFFFFF", family: "Blue", isFavorite: true },
  { id: "clr-carolina-blue", name: "Carolina Blue", hex: "#56A0D3", swatchTextColor: "#FFFFFF", family: "Blue" },
  { id: "clr-light-blue", name: "Light Blue", hex: "#ADD8E6", swatchTextColor: "#000000", family: "Blue" },
  { id: "clr-indigo", name: "Indigo", hex: "#3F51B5", swatchTextColor: "#FFFFFF", family: "Blue" },
  { id: "clr-sapphire", name: "Sapphire", hex: "#0F52BA", swatchTextColor: "#FFFFFF", family: "Blue" },

  // Red family
  { id: "clr-red", name: "Red", hex: "#C41E3A", swatchTextColor: "#FFFFFF", family: "Red", isFavorite: true },
  { id: "clr-cardinal", name: "Cardinal", hex: "#8C1515", swatchTextColor: "#FFFFFF", family: "Red" },
  { id: "clr-cherry-red", name: "Cherry Red", hex: "#DE3163", swatchTextColor: "#FFFFFF", family: "Red" },
  { id: "clr-maroon", name: "Maroon", hex: "#5A1A2A", swatchTextColor: "#FFFFFF", family: "Red" },

  // Green family
  { id: "clr-forest-green", name: "Forest Green", hex: "#228B22", swatchTextColor: "#FFFFFF", family: "Green" },
  { id: "clr-irish-green", name: "Irish Green", hex: "#009A44", swatchTextColor: "#FFFFFF", family: "Green" },
  { id: "clr-military-green", name: "Military Green", hex: "#4B5320", swatchTextColor: "#FFFFFF", family: "Green" },
  { id: "clr-mint", name: "Mint", hex: "#98FF98", swatchTextColor: "#000000", family: "Green" },
  { id: "clr-sage", name: "Sage", hex: "#B2AC88", swatchTextColor: "#000000", family: "Green" },
  { id: "clr-kelly-green", name: "Kelly Green", hex: "#4CBB17", swatchTextColor: "#FFFFFF", family: "Green" },

  // Yellow family
  { id: "clr-gold", name: "Gold", hex: "#FFD700", swatchTextColor: "#000000", family: "Yellow" },
  { id: "clr-daisy", name: "Daisy", hex: "#FBE870", swatchTextColor: "#000000", family: "Yellow" },
  { id: "clr-safety-green", name: "Safety Green", hex: "#CCFF00", swatchTextColor: "#000000", family: "Yellow" },

  // Orange family
  { id: "clr-orange", name: "Orange", hex: "#FF6600", swatchTextColor: "#FFFFFF", family: "Orange" },
  { id: "clr-texas-orange", name: "Texas Orange", hex: "#BF5700", swatchTextColor: "#FFFFFF", family: "Orange" },
  { id: "clr-sunset", name: "Sunset", hex: "#FAD6A5", swatchTextColor: "#000000", family: "Orange" },

  // Purple family
  { id: "clr-purple", name: "Purple", hex: "#6A0DAD", swatchTextColor: "#FFFFFF", family: "Purple" },
  { id: "clr-heather-team-purple", name: "Heather Team Purple", hex: "#5E4B8B", swatchTextColor: "#FFFFFF", family: "Purple" },
  { id: "clr-lilac", name: "Lilac", hex: "#C8A2C8", swatchTextColor: "#000000", family: "Purple" },

  // Pink family
  { id: "clr-hot-pink", name: "Hot Pink", hex: "#FF69B4", swatchTextColor: "#000000", family: "Pink" },
  { id: "clr-light-pink", name: "Light Pink", hex: "#FFB6C1", swatchTextColor: "#000000", family: "Pink" },
  { id: "clr-heliconia", name: "Heliconia", hex: "#E4287C", swatchTextColor: "#FFFFFF", family: "Pink" },

  // Brown family
  { id: "clr-brown-savana", name: "Brown Savana", hex: "#8B4513", swatchTextColor: "#FFFFFF", family: "Brown" },
  { id: "clr-chestnut", name: "Chestnut", hex: "#954535", swatchTextColor: "#FFFFFF", family: "Brown" },
  { id: "clr-sand", name: "Sand", hex: "#C2B280", swatchTextColor: "#000000", family: "Brown" },
];

// ---------------------------------------------------------------------------
// Garment Catalog — mirrors S&S Activewear catalog shape
// ---------------------------------------------------------------------------

const commonColorIds = [
  "clr-black", "clr-white", "clr-navy", "clr-sport-grey", "clr-red",
  "clr-royal", "clr-charcoal", "clr-forest-green", "clr-maroon",
  "clr-gold", "clr-orange", "clr-purple",
];

const extendedColorIds = [
  ...commonColorIds,
  "clr-heather-grey", "clr-carolina-blue", "clr-light-blue",
  "clr-cardinal", "clr-irish-green", "clr-military-green",
  "clr-hot-pink", "clr-indigo", "clr-texas-orange",
];

const standardSizes = [
  { name: "XS", order: 0, priceAdjustment: 0 },
  { name: "S", order: 1, priceAdjustment: 0 },
  { name: "M", order: 2, priceAdjustment: 0 },
  { name: "L", order: 3, priceAdjustment: 0 },
  { name: "XL", order: 4, priceAdjustment: 0 },
  { name: "2XL", order: 5, priceAdjustment: 2.0 },
  { name: "3XL", order: 6, priceAdjustment: 3.0 },
];

export const garmentCatalog: GarmentCatalog[] = [
  {
    id: "gc-001",
    brand: "Bella+Canvas",
    sku: "3001",
    name: "Unisex Jersey Short Sleeve Tee",
    baseCategory: "t-shirts",
    basePrice: 3.5,
    availableColors: extendedColorIds,
    availableSizes: standardSizes,
  },
  {
    id: "gc-002",
    brand: "Gildan",
    sku: "5000",
    name: "Heavy Cotton Tee",
    baseCategory: "t-shirts",
    basePrice: 2.75,
    availableColors: extendedColorIds,
    availableSizes: standardSizes,
  },
  {
    id: "gc-003",
    brand: "Gildan",
    sku: "18500",
    name: "Heavy Blend Hooded Sweatshirt",
    baseCategory: "fleece",
    basePrice: 9.5,
    availableColors: commonColorIds,
    availableSizes: [
      { name: "S", order: 0, priceAdjustment: 0 },
      { name: "M", order: 1, priceAdjustment: 0 },
      { name: "L", order: 2, priceAdjustment: 0 },
      { name: "XL", order: 3, priceAdjustment: 0 },
      { name: "2XL", order: 4, priceAdjustment: 2.5 },
      { name: "3XL", order: 5, priceAdjustment: 3.5 },
      { name: "4XL", order: 6, priceAdjustment: 5.0 },
      { name: "5XL", order: 7, priceAdjustment: 5.0 },
    ],
  },
  {
    id: "gc-004",
    brand: "Next Level",
    sku: "6210",
    name: "Unisex CVC V-Neck Tee",
    baseCategory: "t-shirts",
    basePrice: 4.25,
    availableColors: [
      "clr-black", "clr-white", "clr-navy", "clr-heather-grey",
      "clr-charcoal", "clr-red", "clr-royal", "clr-light-blue",
      "clr-hot-pink", "clr-purple",
    ],
    availableSizes: [
      { name: "XS", order: 0, priceAdjustment: 0 },
      { name: "S", order: 1, priceAdjustment: 0 },
      { name: "M", order: 2, priceAdjustment: 0 },
      { name: "L", order: 3, priceAdjustment: 0 },
      { name: "XL", order: 4, priceAdjustment: 0 },
      { name: "2XL", order: 5, priceAdjustment: 1.5 },
      { name: "3XL", order: 6, priceAdjustment: 2.5 },
    ],
  },
  {
    id: "gc-005",
    brand: "Comfort Colors",
    sku: "1717",
    name: "Garment Dyed Heavyweight Tee",
    baseCategory: "t-shirts",
    basePrice: 5.0,
    availableColors: [
      "clr-black", "clr-white", "clr-navy", "clr-charcoal",
      "clr-ice-grey", "clr-sage", "clr-light-blue",
      "clr-sand", "clr-light-pink", "clr-mint",
      "clr-lilac", "clr-gold", "clr-texas-orange",
    ],
    availableSizes: [
      { name: "S", order: 0, priceAdjustment: 0 },
      { name: "M", order: 1, priceAdjustment: 0 },
      { name: "L", order: 2, priceAdjustment: 0 },
      { name: "XL", order: 3, priceAdjustment: 0 },
      { name: "2XL", order: 4, priceAdjustment: 2.0 },
      { name: "3XL", order: 5, priceAdjustment: 3.0 },
      { name: "4XL", order: 6, priceAdjustment: 4.0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Artwork — customer artwork library
// ---------------------------------------------------------------------------

export const artworks: Artwork[] = [
  // Marcus Rivera (repeat) — 4 artworks
  {
    id: "art-001",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    name: "River City Logo — Full Color",
    fileName: "river-city-logo-full.svg",
    thumbnailUrl: "/mock-artwork/river-city-logo-full.svg",
    colorCount: 3,
    tags: ["corporate"],
    createdAt: "2025-08-15T10:00:00Z",
    lastUsedAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "art-002",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    name: "River City Logo — 1 Color",
    fileName: "river-city-logo-1c.svg",
    thumbnailUrl: "/mock-artwork/river-city-logo-1c.svg",
    colorCount: 1,
    tags: ["corporate"],
    createdAt: "2025-08-15T10:30:00Z",
    lastUsedAt: "2026-01-15T14:00:00Z",
  },
  {
    id: "art-003",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    name: "Pint Night 2026 Promo",
    fileName: "pint-night-2026.svg",
    thumbnailUrl: "/mock-artwork/pint-night-2026.svg",
    colorCount: 2,
    tags: ["promotional", "event"],
    createdAt: "2026-01-20T09:00:00Z",
  },
  {
    id: "art-004",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    name: "Holiday Merch Design 2025",
    fileName: "holiday-merch-2025.svg",
    thumbnailUrl: "/mock-artwork/holiday-merch-2025.svg",
    colorCount: 5,
    tags: ["seasonal"],
    createdAt: "2025-11-01T11:00:00Z",
    lastUsedAt: "2025-12-10T16:00:00Z",
  },
  // Sarah Chen (contract) — 2 artworks
  {
    id: "art-005",
    customerId: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    name: "Lonestar Lacrosse Crest",
    fileName: "lonestar-lax-crest.svg",
    thumbnailUrl: "/mock-artwork/lonestar-lax-crest.svg",
    colorCount: 1,
    tags: ["sports", "corporate"],
    createdAt: "2025-06-01T08:00:00Z",
    lastUsedAt: "2026-02-01T14:30:00Z",
  },
  {
    id: "art-006",
    customerId: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    name: "Tournament 2026 Badge",
    fileName: "tournament-2026-badge.svg",
    thumbnailUrl: "/mock-artwork/tournament-2026-badge.svg",
    colorCount: 2,
    tags: ["event", "sports"],
    createdAt: "2026-01-15T10:00:00Z",
  },
  // Chris Patel (repeat) — 2 artworks
  {
    id: "art-007",
    customerId: "a5e6f7a8-b9c0-4d1e-9f3a-4b5c6d7e8f9a",
    name: "Lakeside Festival Main Logo",
    fileName: "lakeside-main-logo.svg",
    thumbnailUrl: "/mock-artwork/lakeside-main-logo.svg",
    colorCount: 3,
    tags: ["event", "promotional"],
    createdAt: "2025-09-01T12:00:00Z",
    lastUsedAt: "2026-01-25T11:00:00Z",
  },
  {
    id: "art-008",
    customerId: "a5e6f7a8-b9c0-4d1e-9f3a-4b5c6d7e8f9a",
    name: "Volunteer Crew Stamp",
    fileName: "volunteer-crew-stamp.svg",
    thumbnailUrl: "/mock-artwork/volunteer-crew-stamp.svg",
    colorCount: 1,
    tags: ["event", "custom"],
    createdAt: "2026-01-20T14:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Quotes — new schema with printLocationDetails, serviceType, discounts
// ---------------------------------------------------------------------------

export const quotes: Quote[] = [
  {
    id: "01a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    quoteNumber: "Q-1024",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    lineItems: [
      {
        garmentId: "gc-002",
        colorId: "clr-black",
        sizes: { S: 5, M: 15, L: 20, XL: 10 },
        serviceType: "screen-print",
        printLocationDetails: [
          { location: "Front", colorCount: 3, artworkId: "art-001", setupFee: 0 },
          { location: "Back", colorCount: 2, artworkId: "art-002", setupFee: 0 },
        ],
        unitPrice: 14.5,
        lineTotal: 725,
      },
    ],
    setupFees: 40,
    subtotal: 725,
    total: 765,
    discounts: [],
    shipping: 0,
    tax: 0,
    artworkIds: ["art-001", "art-002"],
    status: "draft",
    internalNotes: "Marcus wants same design as spring 2025 run. Check file archive.",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-03T14:20:00Z",
  },
  {
    id: "02b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    quoteNumber: "Q-1025",
    customerId: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    lineItems: [
      {
        garmentId: "gc-001",
        colorId: "clr-white",
        sizes: { S: 8, M: 20, L: 25, XL: 12 },
        serviceType: "screen-print",
        printLocationDetails: [
          { location: "Front", colorCount: 1, artworkId: "art-005", setupFee: 0 },
          { location: "Back", colorCount: 1, setupFee: 0 },
          { location: "Left Sleeve", colorCount: 2, artworkId: "art-006", setupFee: 0 },
        ],
        unitPrice: 22.0,
        lineTotal: 1430,
      },
      {
        garmentId: "gc-001",
        colorId: "clr-navy",
        sizes: { S: 8, M: 20, L: 25, XL: 12 },
        serviceType: "screen-print",
        printLocationDetails: [
          { location: "Front", colorCount: 1, artworkId: "art-005", setupFee: 0 },
          { location: "Back", colorCount: 1, setupFee: 0 },
          { location: "Left Sleeve", colorCount: 2, artworkId: "art-006", setupFee: 0 },
        ],
        unitPrice: 22.0,
        lineTotal: 1430,
      },
    ],
    setupFees: 40,
    subtotal: 2860,
    total: 2614,
    discounts: [
      { label: "Contract Pricing — 10% off", amount: 286, type: "contract" },
    ],
    shipping: 0,
    tax: 0,
    artworkIds: ["art-005", "art-006"],
    status: "sent",
    customerNotes: "Tournament date is Feb 22. Need delivery by Feb 20 at the latest.",
    createdAt: "2026-02-01T14:30:00Z",
    sentAt: "2026-02-02T09:00:00Z",
  },
  {
    id: "03c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e",
    quoteNumber: "Q-1026",
    customerId: "e3c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e",
    lineItems: [
      {
        garmentId: "gc-001",
        colorId: "clr-heather-grey",
        sizes: { YM: 5, YL: 5, S: 10, M: 15, L: 15, XL: 10, "2XL": 5 },
        serviceType: "screen-print",
        printLocationDetails: [
          { location: "Front", colorCount: 4, setupFee: 0 },
        ],
        unitPrice: 12.0,
        lineTotal: 780,
      },
    ],
    setupFees: 40,
    subtotal: 780,
    total: 855,
    discounts: [],
    shipping: 35,
    tax: 0,
    artworkIds: [],
    status: "accepted",
    customerNotes: "Family loves the design! Approved as-is.",
    createdAt: "2026-02-05T09:15:00Z",
    sentAt: "2026-02-05T10:00:00Z",
    updatedAt: "2026-02-06T11:30:00Z",
  },
  {
    id: "14d5e6f7-a8b9-4c0d-ae2f-3a4b5c6d7e8f",
    quoteNumber: "Q-1027",
    customerId: "f4d5e6f7-a8b9-4c0d-8e2f-3a4b5c6d7e8f",
    lineItems: [
      {
        garmentId: "gc-004",
        colorId: "clr-red",
        sizes: { S: 50, M: 100, L: 100, XL: 50 },
        serviceType: "screen-print",
        printLocationDetails: [
          { location: "Front", colorCount: 2, setupFee: 0 },
          { location: "Back", colorCount: 2, setupFee: 0 },
        ],
        unitPrice: 10.5,
        lineTotal: 3150,
      },
      {
        garmentId: "gc-004",
        colorId: "clr-white",
        sizes: { S: 25, M: 50, L: 50, XL: 25 },
        serviceType: "screen-print",
        printLocationDetails: [
          { location: "Front", colorCount: 2, setupFee: 0 },
        ],
        unitPrice: 8.0,
        lineTotal: 1200,
      },
    ],
    setupFees: 40,
    subtotal: 4350,
    total: 4390,
    discounts: [],
    shipping: 0,
    tax: 0,
    artworkIds: [],
    status: "declined",
    internalNotes: "Maria said budget was only $3k. Offered to reduce to 1-color print.",
    customerNotes: "Over budget. Can you do a simpler version?",
    createdAt: "2026-01-28T08:00:00Z",
    sentAt: "2026-01-28T09:30:00Z",
    updatedAt: "2026-01-30T16:00:00Z",
  },
  {
    id: "25e6f7a8-b9c0-4d1e-bf3a-4b5c6d7e8f9a",
    quoteNumber: "Q-1028",
    customerId: "a5e6f7a8-b9c0-4d1e-9f3a-4b5c6d7e8f9a",
    lineItems: [
      {
        garmentId: "gc-005",
        colorId: "clr-black",
        sizes: { S: 30, M: 75, L: 75, XL: 40, "2XL": 20 },
        serviceType: "screen-print",
        printLocationDetails: [
          { location: "Front", colorCount: 3, artworkId: "art-007", setupFee: 0 },
          { location: "Back", colorCount: 3, artworkId: "art-007", setupFee: 0 },
          { location: "Left Sleeve", colorCount: 1, artworkId: "art-008", setupFee: 0 },
        ],
        unitPrice: 18.0,
        lineTotal: 4320,
      },
      {
        garmentId: "gc-003",
        colorId: "clr-navy",
        sizes: { S: 15, M: 30, L: 30, XL: 15 },
        serviceType: "screen-print",
        printLocationDetails: [
          { location: "Front", colorCount: 2, artworkId: "art-007", setupFee: 0 },
        ],
        unitPrice: 24.0,
        lineTotal: 2160,
      },
      {
        garmentId: "gc-001",
        colorId: "clr-white",
        sizes: { M: 50, L: 50, XL: 25 },
        serviceType: "screen-print",
        printLocationDetails: [
          { location: "Front", colorCount: 1, artworkId: "art-008", setupFee: 0 },
        ],
        unitPrice: 7.5,
        lineTotal: 937.5,
      },
    ],
    setupFees: 40,
    subtotal: 7417.5,
    total: 6857.5,
    discounts: [
      { label: "Volume Discount — 500+ units", amount: 600, type: "volume" },
    ],
    shipping: 0,
    tax: 0,
    artworkIds: ["art-007", "art-008"],
    status: "revised",
    internalNotes: "Second revision. Chris asked for hoodie option and volunteer tees. Gave volume discount.",
    customerNotes: "Added hoodies for crew and volunteer tees. Please confirm new total.",
    createdAt: "2026-01-25T11:00:00Z",
    sentAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-04T15:45:00Z",
  },
  {
    id: "36f7a8b9-c0d1-4e2f-8a4b-5c6d7e8f9a0b",
    quoteNumber: "Q-1029",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    lineItems: [
      {
        garmentId: "gc-002",
        colorId: "clr-forest-green",
        sizes: { S: 10, M: 25, L: 25, XL: 15, "2XL": 5 },
        serviceType: "screen-print",
        printLocationDetails: [
          { location: "Front", colorCount: 2, artworkId: "art-001", setupFee: 0 },
          { location: "Back", colorCount: 2, artworkId: "art-002", setupFee: 0 },
        ],
        unitPrice: 13.0,
        lineTotal: 1040,
      },
    ],
    setupFees: 40,
    subtotal: 1040,
    total: 1030,
    discounts: [
      { label: "Repeat Customer — 5% off", amount: 52, type: "manual" },
    ],
    shipping: 0,
    tax: 2,
    artworkIds: ["art-001", "art-002"],
    status: "draft",
    internalNotes: "Repeat order from Marcus. Similar to holiday merch but spring palette.",
    createdAt: "2026-02-07T16:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Screens (unchanged)
// ---------------------------------------------------------------------------

export const screens: Screen[] = [
  {
    id: "51a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    meshCount: 160,
    emulsionType: "Dual Cure",
    burnStatus: "burned",
    jobId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  },
  {
    id: "52b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    meshCount: 230,
    emulsionType: "Dual Cure",
    burnStatus: "burned",
    jobId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  },
  {
    id: "53c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e",
    meshCount: 110,
    emulsionType: "Photopolymer",
    burnStatus: "pending",
    jobId: "d4e5f6a7-b8c9-4d0e-9f2a-3b4c5d6e7f8a",
  },
  {
    id: "54d5e6f7-a8b9-4c0d-9e2f-3a4b5c6d7e8f",
    meshCount: 160,
    emulsionType: "Dual Cure",
    burnStatus: "pending",
    jobId: "d4e5f6a7-b8c9-4d0e-9f2a-3b4c5d6e7f8a",
  },
  {
    id: "55e6f7a8-b9c0-4d1e-af3a-4b5c6d7e8f9a",
    meshCount: 200,
    emulsionType: "Dual Cure",
    burnStatus: "reclaimed",
    jobId: "f6a7b8c9-d0e1-4f2a-bb4c-5d6e7f8a9b0c",
  },
];
