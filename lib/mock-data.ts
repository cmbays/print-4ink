import type { Customer } from "./schemas/customer";
import type { Job } from "./schemas/job";
import type { Quote } from "./schemas/quote";
import type { Screen } from "./schemas/screen";
import type { Color } from "./schemas/color";
import type { GarmentCatalog } from "./schemas/garment";
import type { Artwork } from "./schemas/artwork";

export const customers: Customer[] = [
  {
    id: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    name: "Marcus Rivera",
    company: "River City Brewing Co.",
    email: "marcus@rivercitybrewing.com",
    phone: "(512) 555-0147",
    address: "1200 E 6th St, Austin, TX 78702",
    tag: "repeat",
  },
  {
    id: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    name: "Sarah Chen",
    company: "Lonestar Lacrosse League",
    email: "sarah@lonestarlax.org",
    phone: "(512) 555-0298",
    address: "4500 Mueller Blvd, Austin, TX 78723",
    tag: "contract",
  },
  {
    id: "e3c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e",
    name: "Jake Thompson",
    company: "Thompson Family Reunion 2026",
    email: "jake.thompson@gmail.com",
    phone: "(737) 555-0412",
    address: "789 Live Oak Dr, Round Rock, TX 78664",
    tag: "new",
  },
  {
    id: "f4d5e6f7-a8b9-4c0d-8e2f-3a4b5c6d7e8f",
    name: "Maria Gonzalez",
    company: "Sunset 5K Run",
    email: "maria@sunset5k.org",
    phone: "(512) 555-0533",
    address: "2100 Barton Springs Rd, Austin, TX 78704",
    tag: "new",
  },
  {
    id: "a5e6f7a8-b9c0-4d1e-9f3a-4b5c6d7e8f9a",
    name: "Chris Patel",
    company: "Lakeside Music Festival",
    email: "chris@lakesidefest.com",
    phone: "(737) 555-0671",
    address: "500 E Cesar Chavez, Austin, TX 78701",
    tag: "repeat",
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
    total: 850,
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
    total: 2960,
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
    total: 915,
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
    total: 4500,
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
    total: 1090,
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
