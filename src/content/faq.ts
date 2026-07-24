export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "How far in advance do I need to book a charter?",
    answer:
      "For scheduled business or safari charters, 48–72 hours lets us confirm the ideal aircraft and crew. Medical evacuation and emergency requests are handled immediately — call our dispatch line directly rather than submitting the online form.",
  },
  {
    question: "Why don't you show fixed prices on the website?",
    answer:
      "Charter pricing depends on aircraft type, routing, passenger count, and mission requirements — a mining site visit and a safari transfer cost differently even over similar distances. Submit a charter request and we'll return a detailed quote, usually within a few hours.",
  },
  {
    question: "Can you fly into unpaved or remote airstrips?",
    answer:
      "Yes. Our utility and safari aircraft are specifically operated for unpaved strips across Kenya and the wider region. Tell us your destination in the charter request and we'll confirm suitability and recommend the right aircraft.",
  },
  {
    question: "Do you handle cargo alongside passengers?",
    answer:
      "Most of our aircraft can carry mixed passenger-and-cargo loads within weight and space limits. Flag any cargo, equipment, or dangerous goods in your charter request so we can plan the load correctly.",
  },
  {
    question: "How do I pay for a confirmed booking?",
    answer:
      "Once a quote is approved, you'll receive a secure M-Pesa payment request through your dashboard. Receipts and payment history are available for download at any time.",
  },
  {
    question: "Can NGOs and government agencies set up account billing?",
    answer:
      "Yes — organizations with recurring charter needs can discuss invoicing arrangements with our operations team directly. Mention this in your charter request or contact us to set it up.",
  },
];
