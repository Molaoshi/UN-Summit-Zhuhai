/**
 * Shared game data contract for "UN Summit: Zhuhai".
 * Single source of truth for countries, assets, power cards, blocs,
 * deal types and missions. Imported by BOTH frontend (src/) and backend (api/).
 * Ported from countries-seed.json — do not edit by hand without updating the seed.
 */

export type AssetKey = "military" | "resources" | "energy" | "tech";
/** Deal types are keyed by the asset that produces them. */
export type DealTypeKey = AssetKey;
export type MissionSlot = "public" | "private" | "bonus";

export type CompareOp = "gt" | "gte" | "lt" | "lte";

/** Machine-readable mission condition DSL (see countries-seed.json). */
export type MissionCondition =
  | { kind: "deal_count"; dealType: DealTypeKey; min: number }
  | { kind: "deal_count_compare"; dealType: DealTypeKey; otherCountry: string; otherDealType: DealTypeKey; op: CompareOp }
  | { kind: "deal_with_country"; country: string; dealType: DealTypeKey }
  | { kind: "deal_with_power"; power: string; dealType?: DealTypeKey; min: number }
  | { kind: "deal_with_power_each"; powers: string[] }
  | { kind: "deal_with_energy_rating"; dealType?: DealTypeKey; op: CompareOp; value: number }
  | { kind: "all"; conditions: MissionCondition[] }
  | { kind: "no_deal_type_with_counterparty_of"; dealType: DealTypeKey; otherDealType: DealTypeKey; otherCountry: string }
  | { kind: "no_deals_with_country"; country: string }
  | { kind: "cross_bloc_deals"; min: number }
  | { kind: "deal_types_diversity"; min: number }
  | { kind: "total_deals"; min: number }
  | { kind: "total_deals_compare"; otherCountry: string; op: CompareOp }
  | { kind: "cover_starting_blocs" }
  | { kind: "biggest_bloc" }
  | { kind: "bloc_size"; min: number }
  | { kind: "deal_with_peeked_country" };

export interface AssetData {
  rating: number;
  powers: string[];
}

export interface MissionData {
  slot: MissionSlot;
  text: string;
  condition: MissionCondition;
}

export interface CountryData {
  name: string;
  flag: string;
  startingBloc: string;
  assets: Record<AssetKey, AssetData>;
  hasEspionage: boolean;
  freeCrossBloc: boolean;
  missions: MissionData[];
}

export const DEAL_TYPES: Record<DealTypeKey, string> = {
  "military": "Military Protection",
  "resources": "Infrastructure",
  "energy": "Energy",
  "tech": "Technology"
};

export const STARTING_BLOCS = ["Nuclear Energy", "Green Energy", "Fossil Fuel"] as const;

/** Points each party earns for a deal with a partner in their current bloc. */
export const BLOC_DEAL_POINTS = 3;
/** Points each party earns for a deal outside their bloc (no freeCrossBloc). */
export const CROSS_BLOC_DEAL_POINTS = 2;
/** Points per completed mission. */
export const MISSION_POINTS = 10;
/** Hard cap of deal actions (send / accept / cancel) per country per round. */
export const MAX_DEAL_ACTIONS_PER_ROUND = 3;

export const COUNTRIES: CountryData[] = [
  {
    "name": "China",
    "flag": "🇨🇳",
    "startingBloc": "Nuclear Energy",
    "assets": {
      "military": {
        "powers": [
          "Navy",
          "Ballistic Missiles"
        ],
        "rating": 10
      },
      "resources": {
        "powers": [
          "Metals",
          "Industry & Labor"
        ],
        "rating": 10
      },
      "energy": {
        "powers": [
          "Fossil",
          "Renewable"
        ],
        "rating": 8
      },
      "tech": {
        "powers": [
          "Semi Conductors",
          "Renewable Energy"
        ],
        "rating": 10
      }
    },
    "hasEspionage": false,
    "freeCrossBloc": false,
    "missions": [
      {
        "slot": "public",
        "text": "Sign Infrastructure deals with 2 countries.",
        "condition": {
          "kind": "deal_count",
          "dealType": "resources",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Sign more Infrastructure deals than the number of Military Protection deals the USA signs.",
        "condition": {
          "kind": "deal_count_compare",
          "dealType": "resources",
          "otherCountry": "USA",
          "otherDealType": "military",
          "op": "gt"
        }
      },
      {
        "slot": "bonus",
        "text": "Do not sign Infrastructure deals with any country that has signed a Military Protection deal with the USA.",
        "condition": {
          "kind": "no_deal_type_with_counterparty_of",
          "dealType": "resources",
          "otherDealType": "military",
          "otherCountry": "USA"
        }
      }
    ]
  },
  {
    "name": "USA",
    "flag": "🇺🇸",
    "startingBloc": "Nuclear Energy",
    "assets": {
      "military": {
        "powers": [
          "Aircraft",
          "Ballistic Missiles"
        ],
        "rating": 10
      },
      "resources": {
        "powers": [
          "Industry & Labor",
          "Financial: USD"
        ],
        "rating": 10
      },
      "energy": {
        "powers": [
          "Fossil",
          "Nuclear"
        ],
        "rating": 10
      },
      "tech": {
        "powers": [
          "Semi Conductors",
          "Software"
        ],
        "rating": 10
      }
    },
    "hasEspionage": false,
    "freeCrossBloc": false,
    "missions": [
      {
        "slot": "public",
        "text": "Sign Military Protection deals with 2 countries.",
        "condition": {
          "kind": "deal_count",
          "dealType": "military",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Sign more Military Protection deals than the number of Infrastructure deals China signs.",
        "condition": {
          "kind": "deal_count_compare",
          "dealType": "military",
          "otherCountry": "China",
          "otherDealType": "resources",
          "op": "gt"
        }
      },
      {
        "slot": "bonus",
        "text": "Do not sign Military Protection deals with any country that has signed an Infrastructure deal with China.",
        "condition": {
          "kind": "no_deal_type_with_counterparty_of",
          "dealType": "military",
          "otherDealType": "resources",
          "otherCountry": "China"
        }
      }
    ]
  },
  {
    "name": "France",
    "flag": "🇫🇷",
    "startingBloc": "Nuclear Energy",
    "assets": {
      "military": {
        "powers": [
          "Aircraft",
          "Ballistic Missiles"
        ],
        "rating": 9
      },
      "resources": {
        "powers": [
          "Tourism",
          "Fertile Land & Water"
        ],
        "rating": 5
      },
      "energy": {
        "powers": [
          "Fossil",
          "Nuclear"
        ],
        "rating": 7
      },
      "tech": {
        "powers": [
          "Pharma",
          "Agritech"
        ],
        "rating": 7
      }
    },
    "hasEspionage": false,
    "freeCrossBloc": false,
    "missions": [
      {
        "slot": "public",
        "text": "Sign Military Protection deals with 2 countries.",
        "condition": {
          "kind": "deal_count",
          "dealType": "military",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Secure your food and industry supply: sign 2 Infrastructure deals with countries that have Industry & Labor.",
        "condition": {
          "kind": "deal_with_power",
          "power": "Industry & Labor",
          "dealType": "resources",
          "min": 2
        }
      },
      {
        "slot": "bonus",
        "text": "Be part of a bloc that has at least 4 members at the end of the game.",
        "condition": {
          "kind": "bloc_size",
          "min": 4
        }
      }
    ]
  },
  {
    "name": "Saudi Arabia",
    "flag": "🇸🇦",
    "startingBloc": "Nuclear Energy",
    "assets": {
      "military": {
        "powers": [
          "Drones",
          "Ballistic Missiles"
        ],
        "rating": 5
      },
      "resources": {
        "powers": [
          "Industry & Labor",
          "Currency"
        ],
        "rating": 7
      },
      "energy": {
        "powers": [
          "Fossil",
          "Renewable"
        ],
        "rating": 9
      },
      "tech": {
        "powers": [
          "Chemical",
          "Pharma"
        ],
        "rating": 3
      }
    },
    "hasEspionage": false,
    "freeCrossBloc": false,
    "missions": [
      {
        "slot": "public",
        "text": "Increase water desalination capacity: sign at least 1 deal with a country that has Industry & Labor, AND at least 1 deal with a country that has Agritech.",
        "condition": {
          "kind": "deal_with_power_each",
          "powers": [
            "Industry & Labor",
            "Agritech"
          ]
        }
      },
      {
        "slot": "private",
        "text": "Sign a Military Protection deal with the USA AND an Infrastructure deal with China.",
        "condition": {
          "kind": "all",
          "conditions": [
            {
              "kind": "deal_with_country",
              "country": "USA",
              "dealType": "military"
            },
            {
              "kind": "deal_with_country",
              "country": "China",
              "dealType": "resources"
            }
          ]
        }
      },
      {
        "slot": "bonus",
        "text": "Be a member of the biggest bloc at the end of the game.",
        "condition": {
          "kind": "biggest_bloc"
        }
      }
    ]
  },
  {
    "name": "Canada",
    "flag": "🇨🇦",
    "startingBloc": "Nuclear Energy",
    "assets": {
      "military": {
        "powers": [
          "Aircraft",
          "Navy"
        ],
        "rating": 5
      },
      "resources": {
        "powers": [
          "Metals",
          "Fertile Land & Water"
        ],
        "rating": 6
      },
      "energy": {
        "powers": [
          "Renewable",
          "Nuclear"
        ],
        "rating": 10
      },
      "tech": {
        "powers": [
          "Chemical",
          "Software"
        ],
        "rating": 6
      }
    },
    "hasEspionage": false,
    "freeCrossBloc": false,
    "missions": [
      {
        "slot": "public",
        "text": "Sign Energy deals with 2 countries (export your clean energy).",
        "condition": {
          "kind": "deal_count",
          "dealType": "energy",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Help an energy-poor nation: sign an Energy deal with a country whose Energy rating is 3 or less.",
        "condition": {
          "kind": "deal_with_energy_rating",
          "dealType": "energy",
          "op": "lte",
          "value": 3
        }
      },
      {
        "slot": "bonus",
        "text": "Be a bridge-builder: sign at least 3 deals with countries outside your starting bloc.",
        "condition": {
          "kind": "cross_bloc_deals",
          "min": 3
        }
      }
    ]
  },
  {
    "name": "Sweden",
    "flag": "🇸🇪",
    "startingBloc": "Green Energy",
    "assets": {
      "military": {
        "powers": [
          "Tanks & Artillery",
          "Espionage"
        ],
        "rating": 4
      },
      "resources": {
        "powers": [
          "Industry & Labor",
          "Metals"
        ],
        "rating": 4
      },
      "energy": {
        "powers": [
          "Renewable",
          "Nuclear"
        ],
        "rating": 7
      },
      "tech": {
        "powers": [
          "Pharma",
          "Software"
        ],
        "rating": 5
      }
    },
    "hasEspionage": true,
    "freeCrossBloc": false,
    "missions": [
      {
        "slot": "public",
        "text": "Sign 1 Military Protection deal and 1 Technology deal.",
        "condition": {
          "kind": "all",
          "conditions": [
            {
              "kind": "deal_count",
              "dealType": "military",
              "min": 1
            },
            {
              "kind": "deal_count",
              "dealType": "tech",
              "min": 1
            }
          ]
        }
      },
      {
        "slot": "private",
        "text": "Use your Espionage: sign a deal with the country whose private mission you revealed.",
        "condition": {
          "kind": "deal_with_peeked_country"
        }
      },
      {
        "slot": "bonus",
        "text": "Sign at least 4 deals in total.",
        "condition": {
          "kind": "total_deals",
          "min": 4
        }
      }
    ]
  },
  {
    "name": "Denmark",
    "flag": "🇩🇰",
    "startingBloc": "Green Energy",
    "assets": {
      "military": {
        "powers": [
          "Drones",
          "Navy"
        ],
        "rating": 3
      },
      "resources": {
        "powers": [
          "Industry & Labor",
          "Fertile Land & Water"
        ],
        "rating": 2
      },
      "energy": {
        "powers": [
          "Renewable",
          "Nuclear"
        ],
        "rating": 6
      },
      "tech": {
        "powers": [
          "Pharma",
          "Software"
        ],
        "rating": 5
      }
    },
    "hasEspionage": false,
    "freeCrossBloc": true,
    "missions": [
      {
        "slot": "public",
        "text": "Sign 2 Infrastructure deals with countries that have Industry & Labor.",
        "condition": {
          "kind": "deal_with_power",
          "power": "Industry & Labor",
          "dealType": "resources",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Use your diplomatic freedom (military 3 or less): sign 3 deals with countries outside your starting bloc.",
        "condition": {
          "kind": "cross_bloc_deals",
          "min": 3
        }
      },
      {
        "slot": "bonus",
        "text": "Be a diversified trader: sign at least 1 deal of 3 different deal types.",
        "condition": {
          "kind": "deal_types_diversity",
          "min": 3
        }
      }
    ]
  },
  {
    "name": "Chile",
    "flag": "🇨🇱",
    "startingBloc": "Green Energy",
    "assets": {
      "military": {
        "powers": [
          "Tanks & Artillery",
          "Navy"
        ],
        "rating": 2
      },
      "resources": {
        "powers": [
          "Metals",
          "Tourism"
        ],
        "rating": 3
      },
      "energy": {
        "powers": [
          "Fossil",
          "Renewable"
        ],
        "rating": 3
      },
      "tech": {
        "powers": [
          "Chemical",
          "Renewable Energy"
        ],
        "rating": 1
      }
    },
    "hasEspionage": false,
    "freeCrossBloc": true,
    "missions": [
      {
        "slot": "public",
        "text": "Sign 2 Infrastructure deals exporting your Metals.",
        "condition": {
          "kind": "deal_count",
          "dealType": "resources",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Modernize your mining: sign a Technology deal with a country that has Semi Conductors.",
        "condition": {
          "kind": "deal_with_power",
          "power": "Semi Conductors",
          "dealType": "tech",
          "min": 1
        }
      },
      {
        "slot": "bonus",
        "text": "Be a member of the biggest bloc at the end of the game.",
        "condition": {
          "kind": "biggest_bloc"
        }
      }
    ]
  },
  {
    "name": "Kenya",
    "flag": "🇰🇪",
    "startingBloc": "Green Energy",
    "assets": {
      "military": {
        "powers": [
          "Tanks & Artillery",
          "Drones"
        ],
        "rating": 1
      },
      "resources": {
        "powers": [
          "Tourism",
          "Fertile Land & Water"
        ],
        "rating": 1
      },
      "energy": {
        "powers": [
          "Fossil",
          "Renewable"
        ],
        "rating": 3
      },
      "tech": {
        "powers": [
          "Chemical",
          "Agritech"
        ],
        "rating": 1
      }
    },
    "hasEspionage": false,
    "freeCrossBloc": true,
    "missions": [
      {
        "slot": "public",
        "text": "Sign 2 deals (any type) with countries that have Industry & Labor to attract investment.",
        "condition": {
          "kind": "deal_with_power",
          "power": "Industry & Labor",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Sign a Military Protection deal with a country that has Ballistic Missiles.",
        "condition": {
          "kind": "deal_with_power",
          "power": "Ballistic Missiles",
          "dealType": "military",
          "min": 1
        }
      },
      {
        "slot": "bonus",
        "text": "Use your diplomatic freedom: sign 3 deals with countries outside your starting bloc.",
        "condition": {
          "kind": "cross_bloc_deals",
          "min": 3
        }
      }
    ]
  },
  {
    "name": "New Zealand",
    "flag": "🇳🇿",
    "startingBloc": "Green Energy",
    "assets": {
      "military": {
        "powers": [
          "Navy",
          "Drones"
        ],
        "rating": 1
      },
      "resources": {
        "powers": [
          "Tourism",
          "Fertile Land & Water"
        ],
        "rating": 1
      },
      "energy": {
        "powers": [
          "Fossil",
          "Renewable"
        ],
        "rating": 5
      },
      "tech": {
        "powers": [
          "Chemical",
          "Agritech"
        ],
        "rating": 2
      }
    },
    "hasEspionage": false,
    "freeCrossBloc": true,
    "missions": [
      {
        "slot": "public",
        "text": "Sign 2 Technology deals exporting your Agritech.",
        "condition": {
          "kind": "deal_count",
          "dealType": "tech",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Sign a Military Protection deal with a country that has Ballistic Missiles.",
        "condition": {
          "kind": "deal_with_power",
          "power": "Ballistic Missiles",
          "dealType": "military",
          "min": 1
        }
      },
      {
        "slot": "bonus",
        "text": "Be a member of the biggest bloc at the end of the game.",
        "condition": {
          "kind": "biggest_bloc"
        }
      }
    ]
  },
  {
    "name": "India",
    "flag": "🇮🇳",
    "startingBloc": "Fossil Fuel",
    "assets": {
      "military": {
        "powers": [
          "Navy",
          "Ballistic Missiles"
        ],
        "rating": 7
      },
      "resources": {
        "powers": [
          "Industry & Labor",
          "Fertile Land & Water"
        ],
        "rating": 7
      },
      "energy": {
        "powers": [
          "Fossil",
          "Renewable"
        ],
        "rating": 4
      },
      "tech": {
        "powers": [
          "Pharma",
          "Software"
        ],
        "rating": 7
      }
    },
    "hasEspionage": false,
    "freeCrossBloc": false,
    "missions": [
      {
        "slot": "public",
        "text": "Sign 2 Energy deals to secure your growing energy needs.",
        "condition": {
          "kind": "deal_count",
          "dealType": "energy",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Sign more total deals than China.",
        "condition": {
          "kind": "total_deals_compare",
          "otherCountry": "China",
          "op": "gt"
        }
      },
      {
        "slot": "bonus",
        "text": "Do not sign any deal with China.",
        "condition": {
          "kind": "no_deals_with_country",
          "country": "China"
        }
      }
    ]
  },
  {
    "name": "Japan",
    "flag": "🇯🇵",
    "startingBloc": "Fossil Fuel",
    "assets": {
      "military": {
        "powers": [
          "Navy",
          "Espionage"
        ],
        "rating": 6
      },
      "resources": {
        "powers": [
          "Industry & Labor",
          "Currency"
        ],
        "rating": 9
      },
      "energy": {
        "powers": [
          "Fossil",
          "Nuclear"
        ],
        "rating": 1
      },
      "tech": {
        "powers": [
          "Semi Conductors",
          "Renewable Energy"
        ],
        "rating": 9
      }
    },
    "hasEspionage": true,
    "freeCrossBloc": false,
    "missions": [
      {
        "slot": "public",
        "text": "Energy security! Sign 2 Energy deals.",
        "condition": {
          "kind": "deal_count",
          "dealType": "energy",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Diversify your energy: sign 1 Energy deal with a country that has Fossil power AND 1 Energy deal with a country that has Nuclear power.",
        "condition": {
          "kind": "all",
          "conditions": [
            {
              "kind": "deal_with_power",
              "power": "Fossil",
              "dealType": "energy",
              "min": 1
            },
            {
              "kind": "deal_with_power",
              "power": "Nuclear",
              "dealType": "energy",
              "min": 1
            }
          ]
        }
      },
      {
        "slot": "bonus",
        "text": "Sign 2 Technology deals exporting your Semi Conductors / Renewable Energy tech.",
        "condition": {
          "kind": "deal_count",
          "dealType": "tech",
          "min": 2
        }
      }
    ]
  },
  {
    "name": "South Korea",
    "flag": "🇰🇷",
    "startingBloc": "Fossil Fuel",
    "assets": {
      "military": {
        "powers": [
          "Tanks & Artillery",
          "Ballistic Missiles"
        ],
        "rating": 6
      },
      "resources": {
        "powers": [
          "Industry & Labor",
          "Currency"
        ],
        "rating": 8
      },
      "energy": {
        "powers": [
          "Renewable",
          "Nuclear"
        ],
        "rating": 1
      },
      "tech": {
        "powers": [
          "Semi Conductors",
          "Renewable Energy"
        ],
        "rating": 9
      }
    },
    "hasEspionage": false,
    "freeCrossBloc": false,
    "missions": [
      {
        "slot": "public",
        "text": "Sign 2 Technology deals exporting your Semi Conductors.",
        "condition": {
          "kind": "deal_count",
          "dealType": "tech",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Sign an Energy deal with a country that has Fossil power.",
        "condition": {
          "kind": "deal_with_power",
          "power": "Fossil",
          "dealType": "energy",
          "min": 1
        }
      },
      {
        "slot": "bonus",
        "text": "Sign more Technology deals than Japan.",
        "condition": {
          "kind": "deal_count_compare",
          "dealType": "tech",
          "otherCountry": "Japan",
          "otherDealType": "tech",
          "op": "gt"
        }
      }
    ]
  },
  {
    "name": "Germany",
    "flag": "🇩🇪",
    "startingBloc": "Fossil Fuel",
    "assets": {
      "military": {
        "powers": [
          "Tanks & Artillery",
          "Espionage"
        ],
        "rating": 8
      },
      "resources": {
        "powers": [
          "Industry & Labor",
          "Currency"
        ],
        "rating": 9
      },
      "energy": {
        "powers": [
          "Fossil",
          "Renewable"
        ],
        "rating": 2
      },
      "tech": {
        "powers": [
          "Semi Conductors",
          "Renewable Energy"
        ],
        "rating": 8
      }
    },
    "hasEspionage": true,
    "freeCrossBloc": false,
    "missions": [
      {
        "slot": "public",
        "text": "Secure your energy supply: sign 2 Energy deals.",
        "condition": {
          "kind": "deal_count",
          "dealType": "energy",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Sign an Energy deal with an energy superpower (Energy rating 9 or higher: USA, Canada, or Saudi Arabia).",
        "condition": {
          "kind": "deal_with_energy_rating",
          "dealType": "energy",
          "op": "gte",
          "value": 9
        }
      },
      {
        "slot": "bonus",
        "text": "Sign deals with at least 2 countries outside your starting bloc.",
        "condition": {
          "kind": "cross_bloc_deals",
          "min": 2
        }
      }
    ]
  },
  {
    "name": "Brazil",
    "flag": "🇧🇷",
    "startingBloc": "Fossil Fuel",
    "assets": {
      "military": {
        "powers": [
          "Navy",
          "Espionage"
        ],
        "rating": 7
      },
      "resources": {
        "powers": [
          "Metals",
          "Fertile Land & Water"
        ],
        "rating": 8
      },
      "energy": {
        "powers": [
          "Fossil",
          "Renewable"
        ],
        "rating": 8
      },
      "tech": {
        "powers": [
          "Chemical",
          "Agritech"
        ],
        "rating": 4
      }
    },
    "hasEspionage": true,
    "freeCrossBloc": false,
    "missions": [
      {
        "slot": "public",
        "text": "Sign 2 Infrastructure deals exporting your Metals and food.",
        "condition": {
          "kind": "deal_count",
          "dealType": "resources",
          "min": 2
        }
      },
      {
        "slot": "private",
        "text": "Close your tech gap: sign a Technology deal with a country that has Semi Conductors.",
        "condition": {
          "kind": "deal_with_power",
          "power": "Semi Conductors",
          "dealType": "tech",
          "min": 1
        }
      },
      {
        "slot": "bonus",
        "text": "Be the bridge-builder: sign deals with countries from all 3 starting blocs.",
        "condition": {
          "kind": "cover_starting_blocs"
        }
      }
    ]
  }
];

export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);

export const COUNTRY_BY_NAME: Record<string, CountryData> = Object.fromEntries(
  COUNTRIES.map((c) => [c.name, c]),
);

/** All 8 power cards of a country, in asset order. */
export function powerCardsOf(country: CountryData): string[] {
  return (["military", "resources", "energy", "tech"] as AssetKey[]).flatMap(
    (k) => country.assets[k].powers,
  );
}

/** Which asset/deal-type a power card belongs to for a given country. */
export function dealTypeForPower(
  country: CountryData,
  powerCard: string,
): DealTypeKey | null {
  for (const k of ["military", "resources", "energy", "tech"] as AssetKey[]) {
    if (country.assets[k].powers.includes(powerCard)) return k;
  }
  return null;
}

/** Does this country own this power card at all? */
export function countryHasPower(countryName: string, power: string): boolean {
  const c = COUNTRY_BY_NAME[countryName];
  return c ? powerCardsOf(c).includes(power) : false;
}
