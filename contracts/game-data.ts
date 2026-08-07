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
  /** Simplified Chinese translation of `text` (attached at module init). */
  textZh?: string;
  condition: MissionCondition;
}

export interface CountryData {
  name: string;
  /** Simplified Chinese country name (attached at module init). */
  nameZh?: string;
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

/** Canonical roster of all 15 playable countries (display order). */
export const ALL_COUNTRY_NAMES = COUNTRY_NAMES;

/**
 * Countries named in a country's missions that must also be active for those
 * missions to stay evaluable. (Sweden's espionage peek is dynamic — no
 * dependency.) USA and China are ALWAYS active (hard rule, see below).
 */
export const NAMED_DEPENDENCIES: Record<string, string[]> = {
  "USA": ["China"],
  "China": ["USA"],
  "Saudi Arabia": ["USA", "China"],
  "India": ["China"],
  "South Korea": ["Japan"],
};

/** These two superpowers can never be removed from the roster. */
export const ALWAYS_ACTIVE: readonly string[] = ["USA", "China"];

export type ActiveCountriesResult =
  | { ok: true; countries: string[]; added: string[] }
  | { ok: false; error: string };

/**
 * Validate + normalize a teacher-selected country roster.
 * - `undefined`/`null` means the full 15-country roster.
 * - USA and China must be included (hard rule).
 * - Only known country names; at least 2 countries.
 * - Missing NAMED_DEPENDENCIES are auto-added (never an error); the returned
 *   `added` list tells the caller which ones were pulled in.
 * - Result is de-duplicated and in canonical ALL_COUNTRY_NAMES order.
 */
export function resolveActiveCountries(
  input?: readonly string[] | null,
): ActiveCountriesResult {
  const requested = [...(input ?? ALL_COUNTRY_NAMES)];
  const unknown = requested.filter((n) => !COUNTRY_BY_NAME[n]);
  if (unknown.length > 0) {
    return { ok: false, error: `Unknown country: ${unknown.join(", ")}.` };
  }
  const set = new Set(requested);
  for (const required of ALWAYS_ACTIVE) {
    if (!set.has(required)) {
      return {
        ok: false,
        error: `${ALWAYS_ACTIVE.join(" and ")} must always be active.`,
      };
    }
  }
  // Close the set under NAMED_DEPENDENCIES (auto-add missing countries).
  const added: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const name of [...set]) {
      for (const dep of NAMED_DEPENDENCIES[name] ?? []) {
        if (!set.has(dep)) {
          set.add(dep);
          added.push(dep);
          changed = true;
        }
      }
    }
  }
  if (set.size < 2) {
    return { ok: false, error: "At least 2 countries must be active." };
  }
  const countries = ALL_COUNTRY_NAMES.filter((n) => set.has(n));
  return { ok: true, countries, added };
}

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


// ── Bilingual data (English + 简体中文) ────────────────────────────────────

export type Lang = "en" | "zh";

/** Simplified Chinese name per country (fall back to the English name). */
export const COUNTRY_NAME_ZH: Record<string, string> = {
  "China": "中国",
  "USA": "美国",
  "France": "法国",
  "Saudi Arabia": "沙特阿拉伯",
  "Canada": "加拿大",
  "Sweden": "瑞典",
  "Denmark": "丹麦",
  "Chile": "智利",
  "Kenya": "肯尼亚",
  "New Zealand": "新西兰",
  "India": "印度",
  "Japan": "日本",
  "South Korea": "韩国",
  "Germany": "德国",
  "Brazil": "巴西",
};

/** Simplified Chinese label per starting bloc (custom blocs fall back to raw). */
export const BLOC_ZH: Record<string, string> = {
  "Nuclear Energy": "核能联盟",
  "Green Energy": "绿色能源联盟",
  "Fossil Fuel": "化石燃料联盟",
};

/** Simplified Chinese label per deal type (keyed by DealTypeKey). */
export const DEAL_TYPE_ZH: Record<DealTypeKey, string> = {
  "military": "军事保护",
  "resources": "基础设施",
  "energy": "能源",
  "tech": "科技",
};

/** Simplified Chinese label per power card name. */
export const POWER_ZH: Record<string, string> = {
  "Navy": "海军",
  "Ballistic Missiles": "弹道导弹",
  "Metals": "金属",
  "Industry & Labor": "工业与劳动力",
  "Fossil": "化石燃料",
  "Renewable": "可再生能源",
  "Semi Conductors": "半导体",
  "Renewable Energy": "可再生能源技术",
  "Aircraft": "飞机",
  "Financial: USD": "美元金融",
  "Nuclear": "核能",
  "Software": "软件",
  "Tourism": "旅游业",
  "Fertile Land & Water": "耕地与水资源",
  "Pharma": "制药",
  "Agritech": "农业科技",
  "Drones": "无人机",
  "Currency": "货币",
  "Chemical": "化工",
  "Tanks & Artillery": "坦克与火炮",
  "Espionage": "情报侦察",
};

/**
 * Classroom-appropriate Simplified Chinese translations of all 45 mission
 * texts, keyed by country then mission slot. Power-card / deal-type names
 * match POWER_ZH / DEAL_TYPE_ZH.
 */
export const MISSION_TEXT_ZH: Record<string, Record<MissionSlot, string>> = {
  "China": {
    public: "与2个国家签署基础设施协议。",
    private: "你签署的基础设施协议数量要超过美国签署的军事保护协议数量。",
    bonus: "不要与任何同美国签署了军事保护协议的国家签署基础设施协议。",
  },
  "USA": {
    public: "与2个国家签署军事保护协议。",
    private: "你签署的军事保护协议数量要超过中国签署的基础设施协议数量。",
    bonus: "不要与任何同中国签署了基础设施协议的国家签署军事保护协议。",
  },
  "France": {
    public: "与2个国家签署军事保护协议。",
    private: "保障你的粮食与工业供应：与拥有“工业与劳动力”的国家签署2份基础设施协议。",
    bonus: "游戏结束时，成为一个至少有4个成员的联盟的一员。",
  },
  "Saudi Arabia": {
    public: "提升海水淡化能力：与拥有“工业与劳动力”的国家签署至少1份协议，并与拥有“农业科技”的国家签署至少1份协议。",
    private: "与美国签署1份军事保护协议，并与中国签署1份基础设施协议。",
    bonus: "游戏结束时，成为最大联盟的成员。",
  },
  "Canada": {
    public: "与2个国家签署能源协议（出口你的清洁能源）。",
    private: "帮助能源匮乏的国家：与能源评级为3或更低的国家签署1份能源协议。",
    bonus: "做桥梁建设者：与你起始联盟之外的国家签署至少3份协议。",
  },
  "Sweden": {
    public: "签署1份军事保护协议和1份科技协议。",
    private: "利用你的情报侦察能力：与你揭露了其秘密任务的国家签署1份协议。",
    bonus: "总共签署至少4份协议。",
  },
  "Denmark": {
    public: "与拥有“工业与劳动力”的国家签署2份基础设施协议。",
    private: "利用你的外交自由（军事评级3或更低）：与你起始联盟之外的国家签署3份协议。",
    bonus: "做多元化贸易者：签署3种不同类型的协议各至少1份。",
  },
  "Chile": {
    public: "签署2份出口你金属资源的基础设施协议。",
    private: "实现矿业现代化：与拥有“半导体”的国家签署1份科技协议。",
    bonus: "游戏结束时，成为最大联盟的成员。",
  },
  "Kenya": {
    public: "与拥有“工业与劳动力”的国家签署2份协议（任何类型），以吸引投资。",
    private: "与拥有“弹道导弹”的国家签署1份军事保护协议。",
    bonus: "利用你的外交自由：与你起始联盟之外的国家签署3份协议。",
  },
  "New Zealand": {
    public: "签署2份出口你农业科技的科技协议。",
    private: "与拥有“弹道导弹”的国家签署1份军事保护协议。",
    bonus: "游戏结束时，成为最大联盟的成员。",
  },
  "India": {
    public: "签署2份能源协议，以保障你不断增长的能源需求。",
    private: "签署的协议总数要超过中国。",
    bonus: "不要与中国签署任何协议。",
  },
  "Japan": {
    public: "保障能源安全！签署2份能源协议。",
    private: "实现能源多元化：与拥有“化石燃料”的国家签署1份能源协议，并与拥有“核能”的国家签署1份能源协议。",
    bonus: "签署2份出口你的半导体／可再生能源技术的科技协议。",
  },
  "South Korea": {
    public: "签署2份出口你半导体的科技协议。",
    private: "与拥有“化石燃料”的国家签署1份能源协议。",
    bonus: "签署的科技协议数量要超过日本。",
  },
  "Germany": {
    public: "保障你的能源供应：签署2份能源协议。",
    private: "与能源超级大国（能源评级9或更高：美国、加拿大或沙特阿拉伯）签署1份能源协议。",
    bonus: "与你起始联盟之外的至少2个国家签署协议。",
  },
  "Brazil": {
    public: "签署2份出口你金属和粮食的基础设施协议。",
    private: "缩小你的技术差距：与拥有“半导体”的国家签署1份科技协议。",
    bonus: "做桥梁建设者：与来自全部3个起始联盟的国家签署协议。",
  },
};

// Attach the translations to the static data objects so `nameZh` / `textZh`
// travel everywhere COUNTRIES / COUNTRY_BY_NAME are used.
for (const c of COUNTRIES) {
  c.nameZh = COUNTRY_NAME_ZH[c.name] ?? c.name;
  for (const m of c.missions) {
    m.textZh = MISSION_TEXT_ZH[c.name]?.[m.slot] ?? m.text;
  }
}

/** Localized country name (English name is the fallback). */
export function countryNameFor(name: string, lang: Lang): string {
  return lang === "zh" ? (COUNTRY_NAME_ZH[name] ?? name) : name;
}

/** Localized bloc name; custom (player-founded) blocs keep their raw name. */
export function blocNameFor(name: string, lang: Lang): string {
  return lang === "zh" ? (BLOC_ZH[name] ?? name) : name;
}

/** Localized deal-type label. */
export function dealTypeNameFor(type: DealTypeKey, lang: Lang): string {
  return lang === "zh" ? DEAL_TYPE_ZH[type] : DEAL_TYPES[type];
}

/** Localized power-card name (raw name is the fallback). */
export function powerNameFor(power: string, lang: Lang): string {
  return lang === "zh" ? (POWER_ZH[power] ?? power) : power;
}

/** Localized mission text (English text is the fallback). */
export function missionText(mission: MissionData, lang: Lang): string {
  return lang === "zh" ? (mission.textZh ?? mission.text) : mission.text;
}
