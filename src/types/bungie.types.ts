export interface BungieTokenResponse {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string
    refresh_expires_in: number
    membership_id: string
}

export interface AuthState {
    accessToken: string | null
    refreshToken: string | null
    expiresAt: number | null
    membershipId: string | null
    isAuthenticated: boolean
}

export interface DestinyCharacter {
    characterId: string
    classType: number
    light: number
    emblemBackgroundPath: string
    raceType: number
    genderType: number
    titleRecordHash?: number
}

export interface DestinyCharactersResponse {
    data: Record<string, DestinyCharacter>
}

export interface DestinyProfileResponse {
    Response: { characters: DestinyCharactersResponse }
}

export interface MembershipType {
    Response: { destinyMemberships: Array<{ membershipId: string, membershipType: number }> }
}

export interface CharacterState {
    characters: Record<string, DestinyCharacter> | null
    membershipType: number | null
    destinyMembershipId: number | null
    isLoading: boolean
    error: string | null
}

export interface ManifestState {
    version: string | null
    isLoaded: boolean
    error: string | null
    data: Record<string, DestinyItemDefinition> | null
    titleData: Record<string, DestinyRecordDefinition> | null
}

export interface ManifestResponse {
    Response: { version: string, jsonWorldComponentContentPaths: Record<string, Record<string, string>> }
}

export interface DestinyItem {
    itemHash: number
    itemInstanceId: string
    quantity: number
    bucketHash: number
    state: number
}

export interface InventoryState {
    items: Record<string, DestinyItem[]> | null
    vaultItems: DestinyItem[] | null
    characterInventory: Record<string, DestinyItem[]> | null
    itemInstances: Record<string, DestinyItemInstance> | null
    itemStats: Record<string, { stats: Record<string, DestinyItemStatBlock> }> | null
    itemSockets: Record<string, { sockets: DestinyItemSocketState[] }> | null
    itemPlugObjectives: Record<string, { objectivesPerPlug: Record<string, DestinyObjectiveProgress[]> }> | null
    isLoading: boolean
    error: string | null
}

export interface DestinyItemDefinition {
    displayProperties: {
        name: string
        icon: string
        description: string
    }
    itemType: number
    itemSubType: number
    inventory: {
        bucketTypeHash: number
        tierType: number
    }
    plug?: {
        plugCategoryIdentifier: string
    }
}

export const classNames: Record<number, string> = {
    0: "Titan",
    1: "Hunter",
    2: "Warlock"
}

export interface DestinyRecordDefinition {
    titleInfo?: {
        titlesByGender: {
            Male: string
            Female: string
        }
    }
}

export const bucketHashes = {
    kinetic: 1498876634,
    energy: 2465295065,
    power: 953998645,
    helmet: 3448274439,
    gauntlets: 3551918588,
    chest: 14239492,
    legs: 20886954,
    classItem: 1585787867,
} as const

export const statNames: Record<number, string> = {
    4043523819: "Impact",
    4284893193: "RPM",
    2523465841: "Range",
    155624089: "Stability",
    943549884: "Handling",
    1240592695: "Reload Speed",
    4188031367: "Aim Assistance",
    2715839340: "Recoil Direction",
    1345609583: "Zoom",
    3871231066: "Magazine",
    2837207746: "Swing Speed",
    3022301683: "Charge Rate",
    209426660: "Guard Resistance",
    3736848092: "Guard Endurance",
    925767036: "Ammo Capacity",
    392767087: "Health",
    4244567218: "Melee",
    1735777505: "Grenade",
    144602215: "Super",
    1943323491: "Class",
    2996146975: "Weapons",
}

export const statDisplayOrder: number[] = [
    4043523819, // Impact
    2837207746, // Swing Speed
    3022301683, // Charge Rate
    2523465841, // Range
    155624089,  // Stability
    943549884,  // Handling
    1240592695, // Reload Speed
    4188031367, // Aim Assistance
    1345609583, // Zoom
    2715839340, // Recoil Direction
    3871231066, // Magazine
    4284893193, // RPM
    209426660,  // Guard Resistance
    3736848092, // Guard Endurance
    925767036,  // Ammo Capacity
    392767087,  // Health
    4244567218, // Melee
    1735777505, // Grenade
    144602215,  // Super
    1943323491, // Class
    2996146975, // Weapons
]

export const weaponSubTypes: Record<number, string> = {
    6: "Auto",
    7: "Shotgun",
    9: "Hand Cannon",
    10: "Rocket Launcher",
    11: "Fusion",
    12: "Sniper",
    13: "Pulse",
    14: "Scout",
    17: "Sidearm",
    18: "Sword",
    22: "Linear Fusion",
    23: "Grenade Launcher",
    24: "SMG",
    25: "Trace",
    31: "Bow",
    33: "Glaive",
}

export const damageTypes: Record<number, string> = {
    1: "Kinetic",
    2: "Arc",
    3: "Solar",
    4: "Void",
    6: "Stasis",
    7: "Strand",
}

export const championFrames: Record<string, string[]> = {
    barrier: [
        'Precision Frame',
        'Adaptive Frame',
        'Adaptive Burst Frame',
        'Disruption Frame',
        'Legacy PR-55 Frame',
        'Caster Frame',
        'Support Frame',
    ],
    overload: [
        'Lightweight Frame',
        'Rapid-Fire Frame',
        'Spread Shot Frame',
        'Support AR Frame',
        'Area Denial Frame',
        'Vortex Frame',
        'Dynamic Burst Frame',
    ],
    unstoppable: [
        'Aggressive Frame',
        'Aggressive Burst',
        'High-Impact Frame',
        'Heavy Burst Frame',
        'Rocket-Assisted Frame',
        'Wave Frame',
        'Compressed Wave Frame',
        'Micro-Missile Frame',
        'Double Fire Frame',
    ],
}

export interface DestinyItemInstance {
    gearTier: number | null
    primaryStat: { value: number } | null
    damageType: number
}

export interface DestinyItemStatBlock {
    statHash: number
    value: number
}

export interface DestinyItemSocketState {
    plugHash: number
    isEnabled: boolean
    isVisible: boolean
}

export interface DestinyObjectiveProgress {
    objectiveHash: number
    progress: number
    completionValue: number
    complete: boolean
    visible: boolean
}
