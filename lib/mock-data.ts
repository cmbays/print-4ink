import type { Customer } from "./schemas/customer";
import type { Job } from "./schemas/job";
import type { Quote } from "./schemas/quote";
import type { Screen } from "./schemas/screen";

export const customers: Customer[] = [
  {
    id: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    name: "Marcus Rivera",
    company: "River City Brewing Co.",
    email: "marcus@rivercitybrewing.com",
    phone: "(512) 555-0147",
    address: "1200 E 6th St, Austin, TX 78702",
  },
  {
    id: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    name: "Sarah Chen",
    company: "Lonestar Lacrosse League",
    email: "sarah@lonestarlax.org",
    phone: "(512) 555-0298",
    address: "4500 Mueller Blvd, Austin, TX 78723",
  },
  {
    id: "e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e",
    name: "Jake Thompson",
    company: "Thompson Family Reunion 2026",
    email: "jake.thompson@gmail.com",
    phone: "(737) 555-0412",
    address: "789 Live Oak Dr, Round Rock, TX 78664",
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
    id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    jobNumber: "J-1026",
    title: "Thompson Family Reunion Tees",
    customerId: "e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e",
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
    id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
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
    id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
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
    id: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
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

export const quotes: Quote[] = [
  {
    id: "q1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    quoteNumber: "Q-2048",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    lineItems: [
      {
        description: "Gildan 5000 Black — 3-color front, 2-color back",
        quantity: 50,
        colorCount: 3,
        locations: 2,
        unitPrice: 14.5,
        total: 725,
      },
    ],
    setupFees: 150,
    total: 875,
    status: "approved",
    createdAt: "2026-01-28T10:00:00Z",
  },
  {
    id: "q2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    quoteNumber: "Q-2049",
    customerId: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    lineItems: [
      {
        description: "NB Dry Fit White — 2-color chest, 1-color back number, 1-color sleeve",
        quantity: 65,
        colorCount: 2,
        locations: 3,
        unitPrice: 22.0,
        total: 1430,
      },
      {
        description: "NB Dry Fit Navy — 2-color chest, 1-color back number, 1-color sleeve",
        quantity: 65,
        colorCount: 2,
        locations: 3,
        unitPrice: 22.0,
        total: 1430,
      },
    ],
    setupFees: 250,
    total: 3110,
    status: "sent",
    createdAt: "2026-02-01T14:30:00Z",
  },
  {
    id: "q3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e",
    quoteNumber: "Q-2050",
    customerId: "e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e",
    lineItems: [
      {
        description: "Bella+Canvas 3001 Heather Grey — 4-color front",
        quantity: 65,
        colorCount: 4,
        locations: 1,
        unitPrice: 12.0,
        total: 780,
      },
    ],
    setupFees: 200,
    total: 980,
    status: "draft",
    createdAt: "2026-02-05T09:15:00Z",
  },
];

export const screens: Screen[] = [
  {
    id: "s1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    meshCount: 160,
    emulsionType: "Dual Cure",
    burnStatus: "burned",
    jobId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  },
  {
    id: "s2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    meshCount: 230,
    emulsionType: "Dual Cure",
    burnStatus: "burned",
    jobId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  },
  {
    id: "s3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e",
    meshCount: 110,
    emulsionType: "Photopolymer",
    burnStatus: "pending",
    jobId: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
  },
  {
    id: "s4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f",
    meshCount: 160,
    emulsionType: "Dual Cure",
    burnStatus: "pending",
    jobId: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
  },
  {
    id: "s5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a",
    meshCount: 200,
    emulsionType: "Dual Cure",
    burnStatus: "reclaimed",
    jobId: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
  },
];
