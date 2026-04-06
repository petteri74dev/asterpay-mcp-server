export interface MockMerchant {
  slug: string;
  name: string;
  category: string;
  city: string;
  country: string;
  trustScore: number;
  attestations: number;
  products: MockProduct[];
  businessInfo: MockBusinessInfo;
}

export interface MockProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  availability_status: "in_stock" | "out_of_stock" | "low_stock";
  stock_quantity: number;
  variants?: Array<{ name: string; price: number }>;
}

export interface MockBusinessInfo {
  business_name: string;
  description: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  operating_hours: Record<string, string>;
  delivery: {
    zones: string[];
    fee_eur: number;
    free_above_eur: number;
    estimated_time: string;
  };
  return_policy: string;
  payment_methods: string[];
}

const merchants: MockMerchant[] = [
  {
    slug: "kukkakauppaliisa",
    name: "Kukkakauppa Liisa",
    category: "florist",
    city: "Tampere",
    country: "FI",
    trustScore: 87,
    attestations: 3,
    products: [
      {
        id: "prod_001",
        name: "Red Rose Bouquet",
        description: "12 premium red roses, hand-tied with seasonal greens",
        price: 35.0,
        currency: "EUR",
        availability_status: "in_stock",
        stock_quantity: 23,
        variants: [
          { name: "6 roses", price: 20.0 },
          { name: "12 roses", price: 35.0 },
          { name: "24 roses", price: 60.0 },
        ],
      },
      {
        id: "prod_002",
        name: "Seasonal Wildflower Mix",
        description:
          "Locally sourced wildflowers, changes with the season",
        price: 28.0,
        currency: "EUR",
        availability_status: "in_stock",
        stock_quantity: 15,
      },
      {
        id: "prod_003",
        name: "Orchid in Ceramic Pot",
        description: "Phalaenopsis orchid, white, in handmade ceramic pot",
        price: 45.0,
        currency: "EUR",
        availability_status: "low_stock",
        stock_quantity: 3,
      },
      {
        id: "prod_004",
        name: "Succulent Garden Box",
        description: "Assorted succulents in wooden display box",
        price: 32.0,
        currency: "EUR",
        availability_status: "in_stock",
        stock_quantity: 8,
      },
    ],
    businessInfo: {
      business_name: "Kukkakauppa Liisa",
      description:
        "Family-owned florist in central Tampere, serving fresh flowers since 1998.",
      contact: {
        email: "info@kukkakauppaliisa.fi",
        phone: "+358 40 123 4567",
        address: "Hämeenkatu 12, 33100 Tampere, Finland",
      },
      operating_hours: {
        mon: "09:00-17:00",
        tue: "09:00-17:00",
        wed: "09:00-17:00",
        thu: "09:00-17:00",
        fri: "09:00-18:00",
        sat: "10:00-15:00",
        sun: "closed",
      },
      delivery: {
        zones: ["Tampere", "Pirkanmaa"],
        fee_eur: 5.9,
        free_above_eur: 60,
        estimated_time: "2-4 hours",
      },
      return_policy:
        "Full refund within 24h if quality does not meet expectations. Contact us with a photo.",
      payment_methods: ["x402 (USDC)", "EUR bank transfer"],
    },
  },
  {
    slug: "berlinbrew",
    name: "Berlin Brew Co.",
    category: "coffee",
    city: "Berlin",
    country: "DE",
    trustScore: 92,
    attestations: 5,
    products: [
      {
        id: "prod_101",
        name: "Ethiopian Single Origin 250g",
        description:
          "Light roast, notes of blueberry and jasmine. Sourced from Yirgacheffe.",
        price: 14.5,
        currency: "EUR",
        availability_status: "in_stock",
        stock_quantity: 120,
      },
      {
        id: "prod_102",
        name: "House Blend 1kg",
        description:
          "Medium roast, balanced with chocolate and caramel notes.",
        price: 32.0,
        currency: "EUR",
        availability_status: "in_stock",
        stock_quantity: 85,
      },
      {
        id: "prod_103",
        name: "Cold Brew Concentrate 500ml",
        description: "Ready-to-dilute cold brew. Makes 6 servings.",
        price: 9.9,
        currency: "EUR",
        availability_status: "out_of_stock",
        stock_quantity: 0,
      },
    ],
    businessInfo: {
      business_name: "Berlin Brew Co.",
      description:
        "Specialty coffee roasters based in Kreuzberg, Berlin. Roasting since 2015.",
      contact: {
        email: "hello@berlinbrew.de",
        phone: "+49 30 9876 5432",
        address: "Oranienstraße 45, 10999 Berlin, Germany",
      },
      operating_hours: {
        mon: "07:00-19:00",
        tue: "07:00-19:00",
        wed: "07:00-19:00",
        thu: "07:00-19:00",
        fri: "07:00-20:00",
        sat: "08:00-18:00",
        sun: "09:00-16:00",
      },
      delivery: {
        zones: ["Berlin", "Brandenburg"],
        fee_eur: 4.5,
        free_above_eur: 40,
        estimated_time: "1-2 business days",
      },
      return_policy:
        "Unopened bags can be returned within 14 days for a full refund.",
      payment_methods: ["x402 (USDC)", "EUR bank transfer", "invoice"],
    },
  },
  {
    slug: "parispatisserie",
    name: "Maison Dupont Pâtisserie",
    category: "bakery",
    city: "Paris",
    country: "FR",
    trustScore: 74,
    attestations: 2,
    products: [
      {
        id: "prod_201",
        name: "Croissant Box (6 pcs)",
        description: "Classic butter croissants, baked fresh every morning.",
        price: 12.0,
        currency: "EUR",
        availability_status: "in_stock",
        stock_quantity: 30,
      },
      {
        id: "prod_202",
        name: "Tarte au Citron",
        description: "Lemon tart with meringue topping, serves 6-8.",
        price: 24.0,
        currency: "EUR",
        availability_status: "in_stock",
        stock_quantity: 5,
      },
    ],
    businessInfo: {
      business_name: "Maison Dupont Pâtisserie",
      description:
        "Traditional French pâtisserie in the 6th arrondissement, three generations of baking.",
      contact: {
        email: "bonjour@maisondupont.fr",
        phone: "+33 1 42 34 56 78",
        address: "14 Rue de Sèvres, 75006 Paris, France",
      },
      operating_hours: {
        mon: "closed",
        tue: "07:00-19:00",
        wed: "07:00-19:00",
        thu: "07:00-19:00",
        fri: "07:00-19:00",
        sat: "07:00-20:00",
        sun: "08:00-13:00",
      },
      delivery: {
        zones: ["Paris 1-20", "La Défense"],
        fee_eur: 6.0,
        free_above_eur: 50,
        estimated_time: "Same day (order before 14:00)",
      },
      return_policy:
        "Perishable items cannot be returned. Contact us within 2 hours for quality issues.",
      payment_methods: ["x402 (USDC)", "EUR bank transfer"],
    },
  },
  {
    slug: "amsterdam-tech",
    name: "ByteShop Amsterdam",
    category: "electronics",
    city: "Amsterdam",
    country: "NL",
    trustScore: 45,
    attestations: 1,
    products: [
      {
        id: "prod_301",
        name: "USB-C Hub 7-in-1",
        description: "HDMI 4K, USB 3.0 x3, SD/microSD, PD 100W passthrough.",
        price: 39.0,
        currency: "EUR",
        availability_status: "in_stock",
        stock_quantity: 200,
      },
      {
        id: "prod_302",
        name: "Mechanical Keyboard (65%)",
        description:
          "Hot-swappable switches, PBT keycaps, wireless + USB-C.",
        price: 89.0,
        currency: "EUR",
        availability_status: "in_stock",
        stock_quantity: 42,
      },
      {
        id: "prod_303",
        name: "Webcam 1080p",
        description:
          "Auto-focus, built-in mic, privacy shutter. USB plug-and-play.",
        price: 55.0,
        currency: "EUR",
        availability_status: "low_stock",
        stock_quantity: 4,
      },
    ],
    businessInfo: {
      business_name: "ByteShop Amsterdam",
      description:
        "Tech accessories and peripherals, shipping across the EU from Amsterdam.",
      contact: {
        email: "support@byteshop.nl",
        phone: "+31 20 555 1234",
        address: "Keizersgracht 200, 1016 DZ Amsterdam, Netherlands",
      },
      operating_hours: {
        mon: "09:00-18:00",
        tue: "09:00-18:00",
        wed: "09:00-18:00",
        thu: "09:00-21:00",
        fri: "09:00-18:00",
        sat: "10:00-17:00",
        sun: "closed",
      },
      delivery: {
        zones: ["Netherlands", "Belgium", "Germany", "EU"],
        fee_eur: 7.5,
        free_above_eur: 75,
        estimated_time: "1-3 business days (NL), 3-5 days (EU)",
      },
      return_policy: "14-day return policy per EU consumer rights. Free return shipping within NL.",
      payment_methods: ["x402 (USDC)", "EUR bank transfer", "iDEAL"],
    },
  },
];

export function getMockMerchants(): MockMerchant[] {
  return merchants;
}

export function getMockMerchant(slug: string): MockMerchant | undefined {
  return merchants.find((m) => m.slug === slug);
}

export function getDefaultMockMerchant(): MockMerchant {
  return merchants[0];
}

export function getMockProducts(slug?: string): MockProduct[] {
  const merchant = slug
    ? getMockMerchant(slug)
    : getDefaultMockMerchant();
  return merchant?.products ?? [];
}

export function getMockProduct(
  productId: string,
  slug?: string,
): MockProduct | undefined {
  const products = getMockProducts(slug);
  return products.find((p) => p.id === productId);
}

export function getMockBusinessInfo(slug?: string): MockBusinessInfo {
  const merchant = slug
    ? getMockMerchant(slug)
    : getDefaultMockMerchant();
  return (
    merchant?.businessInfo ?? getDefaultMockMerchant().businessInfo
  );
}
