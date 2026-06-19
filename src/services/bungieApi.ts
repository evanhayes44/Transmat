import { useAuthStore } from "../store/authStore"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function bungieGet(endpoint: string): Promise<any> {
    const accessToken = useAuthStore.getState().accessToken
    const bungieApiKey = import.meta.env.VITE_BUNGIE_API_KEY

    const response = await fetch(`https://www.bungie.net/Platform/${endpoint}`, {
        method: "GET",
        headers: {
            "X-API-KEY": bungieApiKey,
            "Authorization": `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`)
    }

    return await response.json()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function bungiePost(endpoint: string, body: object): Promise<any> {
    const accessToken = useAuthStore.getState().accessToken
    const bungieApiKey = import.meta.env.VITE_BUNGIE_API_KEY

    const response = await fetch(`https://www.bungie.net/Platform/${endpoint}`, {
        method: "POST",
        headers: {
            "X-API-KEY": bungieApiKey,
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        throw new Error(`Bungie API error: ${response.status}`)
    }

    return await response.json()
}

export async function transferItem(
    itemReferenceHash: number,
    itemId: string,
    characterId: string,
    membershipType: number,
    transferToVault: boolean
): Promise<void> {
    await bungiePost('Destiny2/Actions/Items/TransferItem/', {
        itemReferenceHash,
        stackSize: 1,
        transferToVault,
        itemId,
        characterId,
        membershipType,
    })
}

export async function equipItem(
    itemId: string,
    characterId: string,
    membershipType: number
): Promise<void> {
    await bungiePost('Destiny2/Actions/Items/EquipItem/', {
        itemId,
        characterId,
        membershipType,
    })
}