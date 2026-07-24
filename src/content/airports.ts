export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export const airports: Airport[] = [
  { code: "WIL", name: "Wilson Airport", city: "Nairobi", country: "Kenya" },
  { code: "NBO", name: "Jomo Kenyatta International", city: "Nairobi", country: "Kenya" },
  { code: "MRE", name: "Mara Serena", city: "Maasai Mara", country: "Kenya" },
  { code: "ASV", name: "Amboseli Airport", city: "Amboseli", country: "Kenya" },
  { code: "UKA", name: "Ukunda Airport", city: "Diani", country: "Kenya" },
  { code: "MBA", name: "Moi International", city: "Mombasa", country: "Kenya" },
  { code: "LAU", name: "Manda Airport", city: "Lamu", country: "Kenya" },
  { code: "LOK", name: "Lodwar Airport", city: "Lodwar", country: "Kenya" },
  { code: "KIS", name: "Kisumu International", city: "Kisumu", country: "Kenya" },
  { code: "EDL", name: "Eldoret International", city: "Eldoret", country: "Kenya" },
  { code: "MYD", name: "Malindi Airport", city: "Malindi", country: "Kenya" },
  { code: "NYK", name: "Nanyuki Airport", city: "Nanyuki", country: "Kenya" },
  { code: "ZNZ", name: "Zanzibar International", city: "Zanzibar", country: "Tanzania" },
  { code: "JRO", name: "Kilimanjaro International", city: "Arusha", country: "Tanzania" },
  { code: "KGL", name: "Kigali International", city: "Kigali", country: "Rwanda" },
  { code: "EBB", name: "Entebbe International", city: "Entebbe", country: "Uganda" },
  { code: "JUB", name: "Juba International", city: "Juba", country: "South Sudan" },
  { code: "ADD", name: "Bole International", city: "Addis Ababa", country: "Ethiopia" },
];
