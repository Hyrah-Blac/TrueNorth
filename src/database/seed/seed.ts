import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import mongoose from "mongoose";
import connectToDatabase from "../connection";
import User from "../models/User";
import Aircraft from "../models/Aircraft";
import Quote from "../models/Quote";
import Booking from "../models/Booking";
import Payment from "../models/Payment";
import { ROLES } from "../constants/roles";
import { AIRCRAFT_STATUSES } from "../constants/aircraft";
import { QUOTE_STATUSES } from "../constants/quote-status";
import { BOOKING_STATUSES } from "../constants/booking-status";
import { PAYMENT_STATUSES, PAYMENT_METHODS } from "../constants/payment-status";

async function seed() {
  console.log("Connecting to MongoDB...");
  await connectToDatabase();

  console.log("Clearing existing seed-flagged data...");
  await Promise.all([
    Payment.deleteMany({}),
    Booking.deleteMany({}),
    Quote.deleteMany({}),
    Aircraft.deleteMany({}),
    User.deleteMany({ email: { $regex: /@seed\.truenorthair\.co\.ke$/ } }),
  ]);

  // --- Users ---------------------------------------------------------
  // These use placeholder Clerk IDs and cannot actually sign in — Clerk
  // owns real authentication. To explore the customer dashboard as a
  // real account, sign up normally through the app, then promote that
  // account to admin from another admin account (or directly in
  // MongoDB for the very first admin). These seed users exist so the
  // admin dashboard's bookings/quotes/customers/payments views have
  // realistic data to browse immediately.
  console.log("Seeding users...");

  const admin = await User.create({
    clerkId: "seed_admin_placeholder",
    email: "admin@seed.truenorthcharters.co.ke",
    firstName: "Amina",
    lastName: "Otieno",
    role: ROLES.ADMIN,
    isActive: true,
  });

  const customers = await User.create([
    {
      clerkId: "seed_customer_1",
      email: "james.mwangi@seed.truenorthcharters.co.ke",
      firstName: "James",
      lastName: "Mwangi",
      phone: "+254712000001",
      company: "Highland Mining Co.",
      role: ROLES.CUSTOMER,
      isActive: true,
    },
    {
      clerkId: "seed_customer_2",
      email: "sarah.kimani@seed.truenorthcharters.co.ke",
      firstName: "Sarah",
      lastName: "Kimani",
      phone: "+254712000002",
      company: "Turkana Relief Initiative",
      role: ROLES.CUSTOMER,
      isActive: true,
    },
    {
      clerkId: "seed_customer_3",
      email: "david.omondi@seed.truenorthcharters.co.ke",
      firstName: "David",
      lastName: "Omondi",
      phone: "+254712000003",
      role: ROLES.CUSTOMER,
      isActive: true,
    },
  ]);

  // --- Aircraft --------------------------------------------------------
  console.log("Seeding aircraft...");

  const aircraftData = [
    {
      name: "Airbus H125",
      category: "helicopter",
      manufacturer: "Airbus Helicopters",
      model: "H125",
      registration: "5Y-KAH",
      tagline: "Agile point-to-point access, no runway required",
      description:
        "The H125 is the backbone of our helicopter operations — high-altitude capable, fast to deploy, and equally at home on a mining pad or a VIP helipad transfer.",
      passengerCapacity: 5,
      luggageCapacityKg: 100,
      rangeNm: 350,
      cruisingSpeedKts: 140,
      amenities: ["Air conditioning", "Noise-cancelling headsets", "Rear-facing cargo basket"],
      recommendedMissions: ["mining_industrial", "film_media", "vip_transport", "emergency"],
      isFeatured: true,
    },
    {
      name: "Cessna Grand Caravan EX",
      category: "turboprop",
      manufacturer: "Textron Aviation",
      model: "208B Grand Caravan EX",
      registration: "5Y-KAT",
      tagline: "The regional business travel workhorse",
      description:
        "Short-field capable and efficient over Kenya's domestic routes, the Grand Caravan EX comfortably seats a small executive team with room for luggage.",
      passengerCapacity: 9,
      luggageCapacityKg: 340,
      rangeNm: 900,
      cruisingSpeedKts: 185,
      amenities: ["Leather seating", "Air conditioning", "In-flight Wi-Fi"],
      recommendedMissions: ["business", "government"],
      isFeatured: true,
    },
    {
      name: "Cessna Citation CJ3+",
      category: "light_jet",
      manufacturer: "Textron Aviation",
      model: "Citation CJ3+",
      registration: "5Y-KAJ",
      tagline: "Faster, quieter regional executive travel",
      description:
        "For longer regional legs across East Africa, the CJ3+ offers a quiet cabin and a faster cruise without the overhead of a heavy jet.",
      passengerCapacity: 7,
      luggageCapacityKg: 220,
      rangeNm: 2000,
      cruisingSpeedKts: 416,
      amenities: ["Leather seating", "Refreshment center", "In-flight Wi-Fi", "Air conditioning"],
      recommendedMissions: ["business", "vip_transport", "government"],
      isFeatured: true,
    },
    {
      name: "Cessna 208B Caravan (Utility)",
      category: "utility",
      manufacturer: "Textron Aviation",
      model: "208B Caravan",
      registration: "5Y-KAU",
      tagline: "Rugged, dependable, mixed passenger-and-cargo capable",
      description:
        "Built for unpaved strips and remote field operations, the utility Caravan handles mixed passenger and cargo loads across varied terrain.",
      passengerCapacity: 12,
      luggageCapacityKg: 500,
      rangeNm: 1000,
      cruisingSpeedKts: 175,
      amenities: ["Reinforced cargo flooring", "Quick-change seating configuration"],
      recommendedMissions: ["ngo_humanitarian", "cargo", "mining_industrial"],
      isFeatured: false,
    },
    {
      name: "King Air C90 Medevac",
      category: "medevac",
      manufacturer: "Beechcraft",
      model: "King Air C90",
      registration: "5Y-KAM",
      tagline: "Stretcher-configured for time-critical transfers",
      description:
        "Medically equipped and on standby for inter-facility transfers and emergency response, with mounts for stretcher and monitoring equipment.",
      passengerCapacity: 2,
      luggageCapacityKg: 80,
      rangeNm: 1200,
      cruisingSpeedKts: 226,
      amenities: ["Stretcher mount", "Oxygen system", "Medical equipment mounts"],
      recommendedMissions: ["medical_evacuation", "emergency"],
      isFeatured: false,
    },
    {
      name: "Cessna 206 Stationair",
      category: "safari",
      manufacturer: "Textron Aviation",
      model: "206H Stationair",
      registration: "5Y-KAS",
      tagline: "Scenic low-altitude flying into bush airstrips",
      description:
        "Sized for small tour groups, the Stationair operates comfortably into the bush airstrips serving Kenya's reserves and conservancies.",
      passengerCapacity: 5,
      luggageCapacityKg: 150,
      rangeNm: 700,
      cruisingSpeedKts: 140,
      amenities: ["Large observation windows", "Air conditioning"],
      recommendedMissions: ["safari_tourism"],
      isFeatured: true,
    },
    {
      name: "Cessna 208B Cargo Pod",
      category: "cargo",
      manufacturer: "Textron Aviation",
      model: "208B Caravan (Cargo Pod)",
      registration: "5Y-KAC",
      tagline: "Freight capacity for time-sensitive loads",
      description:
        "Available on request for oversized or time-sensitive freight across the region, with an under-fuselage cargo pod for added capacity.",
      passengerCapacity: 2,
      luggageCapacityKg: 1200,
      rangeNm: 950,
      cruisingSpeedKts: 175,
      amenities: ["Under-fuselage cargo pod", "Reinforced flooring"],
      recommendedMissions: ["cargo"],
      isFeatured: false,
    },
  ];

  const aircraft = await Aircraft.create(
    aircraftData.map((item) => ({
      ...item,
      baseAirportCode: "WIL",
      status: AIRCRAFT_STATUSES.ACTIVE,
      createdBy: admin._id,
    }))
  );

  const [helicopter, turboprop, , , , safari] = aircraft;

  // --- Quotes (a spread of statuses) -----------------------------------
  console.log("Seeding quotes...");

  await Quote.create([
    {
      customer: customers[0]._id,
      contactInfo: {
        fullName: `${customers[0].firstName} ${customers[0].lastName}`,
        email: customers[0].email,
        phone: customers[0].phone,
        company: customers[0].company,
      },
      passengerCount: 4,
      departureAirportCode: "WIL",
      destinationAirportCode: "LOK",
      departureDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      isRoundTrip: false,
      aircraftPreference: helicopter._id,
      missionType: "mining_industrial",
      status: QUOTE_STATUSES.PENDING,
      hasMedicalEquipment: false,
      hasVipRequirements: false,
      hasCargo: true,
      cargoDetails: "Survey equipment, approx. 80kg",
      hasPets: false,
      hasDangerousGoods: false,
      attachments: [],
    },
    {
      customer: customers[1]._id,
      contactInfo: {
        fullName: `${customers[1].firstName} ${customers[1].lastName}`,
        email: customers[1].email,
        phone: customers[1].phone,
        company: customers[1].company,
      },
      passengerCount: 6,
      departureAirportCode: "WIL",
      destinationAirportCode: "LOK",
      departureDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      isRoundTrip: true,
      returnDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      missionType: "ngo_humanitarian",
      status: QUOTE_STATUSES.REVIEWING,
      hasMedicalEquipment: false,
      hasVipRequirements: false,
      hasCargo: true,
      cargoDetails: "Field supplies",
      hasPets: false,
      hasDangerousGoods: false,
      attachments: [],
    },
    {
      customer: customers[2]._id,
      contactInfo: {
        fullName: `${customers[2].firstName} ${customers[2].lastName}`,
        email: customers[2].email,
        phone: customers[2].phone,
      },
      passengerCount: 2,
      departureAirportCode: "WIL",
      destinationAirportCode: "MRE",
      departureDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      isRoundTrip: true,
      returnDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      aircraftPreference: safari._id,
      missionType: "safari_tourism",
      status: QUOTE_STATUSES.REJECTED,
      rejectionReason: "No aircraft available for the requested dates — fully booked.",
      hasMedicalEquipment: false,
      hasVipRequirements: false,
      hasCargo: false,
      hasPets: false,
      hasDangerousGoods: false,
      attachments: [],
    },
  ]);

  // --- A confirmed booking with a completed payment --------------------
  console.log("Seeding a sample booking + payment...");

  const departureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const booking = await Booking.create({
    customer: customers[0]._id,
    aircraft: turboprop._id,
    passengerCount: 5,
    departureAirportCode: "WIL",
    destinationAirportCode: "KIS",
    departureDate,
    isRoundTrip: false,
    missionType: "business",
    totalAmount: 480000,
    paidAmount: 480000,
    currency: "KES",
    status: BOOKING_STATUSES.CONFIRMED,
    timeline: [
      { status: BOOKING_STATUSES.PENDING, changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { status: BOOKING_STATUSES.CONFIRMED, changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    ],
  });

  await Payment.create({
    booking: booking._id,
    customer: customers[0]._id,
    amount: 480000,
    currency: "KES",
    method: PAYMENT_METHODS.MPESA,
    status: PAYMENT_STATUSES.COMPLETED,
    mpesa: {
      phoneNumber: customers[0].phone,
      merchantRequestId: "seed-merchant-req-001",
      checkoutRequestId: "seed-checkout-req-001",
      mpesaReceiptNumber: "SEED1A2B3C",
      transactionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      resultCode: 0,
      resultDescription: "The service request is processed successfully.",
    },
  });

  console.log("\nSeed complete:");
  console.log(`  ${aircraft.length} aircraft`);
  console.log(`  ${customers.length} demo customers + 1 admin placeholder`);
  console.log("  3 quotes (pending / reviewing / rejected)");
  console.log("  1 confirmed booking with a completed payment");
  console.log(
    "\nNote: seeded users have placeholder Clerk IDs and cannot sign in. Sign up normally through the app to get a real account, then promote it to admin."
  );

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
