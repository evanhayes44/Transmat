import { useCharacters } from "../hooks/useCharacters";
import { useCharacterStore } from "../store/characterStore";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { useInventory } from "../hooks/useInventory";
import { useInventoryStore } from "../store/inventoryStore";
import { useManifestStore } from "../store/manifestStore";
import { ItemModal } from '../components/ItemModal'
import {
    classNames,
    bucketHashes,
    weaponSubTypes,
    damageTypes,
    championFrames
} from "../types/bungie.types";
import type { DestinyItem } from "../types/bungie.types";
import { useState } from "react";

export function InventoryView() {
    useCharacters()
    useInventory()

    const { characters } = useCharacterStore()
    const { logout } = useAuthStore()
    const {
        items,
        vaultItems,
        characterInventory,
        itemInstances,
        itemStats,
        itemSockets,
        itemPlugObjectives,
        isLoading
    } = useInventoryStore()

    const { data: manifestData, titleData } = useManifestStore()
    const navigate = useNavigate()

    const [sortBy, setSortBy] = useState<'power-desc' | 'power-asc' | 'name'>('power-desc')
    const [filterMasterwork, setFilterMasterwork] = useState(false)
    const [filterWeaponType, setFilterWeaponType] = useState<number | null>(null)
    const [filterElement, setFilterElement] = useState<number | null>(null)
    const [filterExotic, setFilterExotic] = useState(false)
    const [filterChampion, setFilterChampion] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState('')

    const [selectedItem, setSelectedItem] = useState<DestinyItem | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    useInventory(refreshKey)

    function applyFilters(arr: DestinyItem[] | null) {
        if (!arr) return []
        let result = [...arr]
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(item => manifestData?.[String(item.itemHash)]?.displayProperties?.name?.toLowerCase().includes(q))
        }
        if (filterMasterwork) result = result.filter(item => (item.state & 4) !== 0)
        if (filterExotic) result = result.filter(item => manifestData?.[String(item.itemHash)]?.inventory?.tierType === 6)

        if (filterWeaponType !== null) result = result.filter(item => manifestData?.[String(item.itemHash)]?.itemSubType === filterWeaponType)
        if (filterElement !== null) result = result.filter(item => (itemInstances?.[item.itemInstanceId]?.damageType ?? 0) === filterElement)

        if (filterChampion) {
            const frames = championFrames[filterChampion] ?? []
            result = result.filter(item => {
                const sockets = itemSockets?.[item.itemInstanceId]?.sockets ?? []
                return sockets.some(s => {
                    if (!s.isVisible || !s.plugHash) return false
                    const plugName = manifestData?.[String(s.plugHash)]?.displayProperties.name ?? ''
                    return frames.includes(plugName)
                })
            })
        }

        if (sortBy === 'power-desc') result.sort((a, b) => (itemInstances?.[b.itemInstanceId]?.primaryStat?.value ?? 0) - (itemInstances?.[a.itemInstanceId]?.primaryStat?.value ?? 0))
        else if (sortBy === 'power-asc') result.sort((a, b) => (itemInstances?.[a.itemInstanceId]?.primaryStat?.value ?? 0) - (itemInstances?.[b.itemInstanceId]?.primaryStat?.value ?? 0))
        else result.sort((a, b) => (manifestData?.[String(a.itemHash)]?.displayProperties?.name ?? '').localeCompare(manifestData?.[String(b.itemHash)]?.displayProperties?.name ?? ''))
        return result
    }

    const vaultKinetic = applyFilters(vaultItems?.filter(item =>
        manifestData?.[String(item.itemHash)]?.inventory?.bucketTypeHash === bucketHashes.kinetic
    ) ?? [])
    const vaultEnergy = applyFilters(vaultItems?.filter(item =>
        manifestData?.[String(item.itemHash)]?.inventory?.bucketTypeHash === bucketHashes.energy
    ) ?? [])
    const vaultPower = applyFilters(vaultItems?.filter(item =>
        manifestData?.[String(item.itemHash)]?.inventory?.bucketTypeHash === bucketHashes.power
    ) ?? [])
    const vaultHelmet = applyFilters(vaultItems?.filter(item =>
        manifestData?.[String(item.itemHash)]?.inventory?.bucketTypeHash === bucketHashes.helmet
    ) ?? [])
    const vaultGauntlets = applyFilters(vaultItems?.filter(item =>
        manifestData?.[String(item.itemHash)]?.inventory?.bucketTypeHash === bucketHashes.gauntlets
    ) ?? [])
    const vaultChest = applyFilters(vaultItems?.filter(item =>
        manifestData?.[String(item.itemHash)]?.inventory?.bucketTypeHash === bucketHashes.chest
    ) ?? [])
    const vaultLegs = applyFilters(vaultItems?.filter(item =>
        manifestData?.[String(item.itemHash)]?.inventory?.bucketTypeHash === bucketHashes.legs
    ) ?? [])
    const vaultClassItem = applyFilters(vaultItems?.filter(item =>
        manifestData?.[String(item.itemHash)]?.inventory?.bucketTypeHash === bucketHashes.classItem
    ) ?? [])

    const vaultMisc = vaultItems?.filter((item) =>
        manifestData?.[String(item.itemHash)]?.itemType !== 2 && manifestData?.[String(item.itemHash)]?.itemType !== 3
    ) ?? []

    function handleLogout() {
        logout()
        navigate("/")
    }

    return (
        <div className="inv-page">
            <div className="inv-header">
                <p className="inv-title">Transmat</p>
                <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
            <div className="inv-characters">
                {isLoading ? (
                    Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="inv-character-panel">
                            <div className="skeleton skeleton-header" />
                            {Array.from({ length: 8 }, (_, j) => (
                                <div key={j} className="inv-section">
                                    <div className="skeleton skeleton-text" />
                                    <div className="inv-slot">
                                        <div className="skeleton skeleton-item" />
                                        <div className="inv-slot-grid">
                                            {Array.from({ length: 9 }, (_, k) => (
                                                <div key={k} className="skeleton skeleton-item" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    items && Object.entries(items).map(([characterId, itemArray]) => {
                        const character = characters?.[characterId]
                        const className = character ? classNames[character.classType] : characterId

                        const genderKey = character?.genderType === 1 ? "Female" : "Male"
                        const characterTitle = titleData?.[String(character?.titleRecordHash)]?.titleInfo?.titlesByGender?.[genderKey]

                        const charInventory = characterInventory?.[characterId] ?? []

                        const charKinetic = charInventory.filter(item => item.bucketHash === bucketHashes.kinetic)
                        const charEnergy = charInventory.filter(item => item.bucketHash === bucketHashes.energy)
                        const charPower = charInventory.filter(item => item.bucketHash === bucketHashes.power)
                        const charHelmet = charInventory.filter(item => item.bucketHash === bucketHashes.helmet)
                        const charGauntlets = charInventory.filter(item => item.bucketHash === bucketHashes.gauntlets)
                        const charChest = charInventory.filter(item => item.bucketHash === bucketHashes.chest)
                        const charLegs = charInventory.filter(item => item.bucketHash === bucketHashes.legs)
                        const charClassItem = charInventory.filter(item => item.bucketHash === bucketHashes.classItem)

                        return (
                            <div key={characterId} className="inv-character-panel">
                                <div className="inv-character-header" style={{ backgroundImage: `url(https://www.bungie.net${character?.emblemBackgroundPath})` }}>
                                    <div className="inv-character-header-overlay">
                                        <div className="inv-character-info">
                                            <span className="inv-character-name">{className}</span>
                                            <span className="inv-character-title">{characterTitle}</span>
                                        </div>
                                        <span className="inv-character-power">◆ {character?.light}</span>
                                    </div>
                                </div>
                                <div className="inv-section">
                                    <p className="inv-section-label">Kinetic</p>
                                    <div className="inv-slot">
                                        {(() => {
                                            const item = itemArray.find(i => i.bucketHash === bucketHashes.kinetic)
                                            if (!item) return <div className="inv-item-empty" />
                                            const itemDef = manifestData?.[String(item.itemHash)]
                                            const iconUrl = `https://www.bungie.net${itemDef?.displayProperties?.icon}`
                                            const itemName = itemDef?.displayProperties?.name ?? String(item.itemHash)
                                            return (
                                                <div key={item.itemInstanceId} className={`inv-item inv-item-equipped${(item.state & 4) !== 0 ? ' inv-item-masterwork' : ''}`} onClick={() => setSelectedItem(item)}
                                                >
                                                    <img src={iconUrl} alt={itemName} />
                                                    {(() => {
                                                        const gearTier = itemInstances?.[item.itemInstanceId]?.gearTier
                                                        if (!gearTier) return null
                                                        return (
                                                            <div className="inv-item-tier">
                                                                {gearTier ? Array.from({ length: 5 }, (_, i) => (
                                                                    <span key={i} className={i < gearTier ? 'tier-pip tier-pip-filled' : 'tier-pip'}>◆</span>
                                                                )) : null}
                                                            </div>
                                                        )
                                                    })()}
                                                    {(() => {
                                                        const power = itemInstances?.[item.itemInstanceId]?.primaryStat?.value
                                                        if (!power) return null
                                                        return <span className="inv-item-power">{power}</span>
                                                    })()}
                                                    <div className="inv-item-tooltip">{itemName}</div>
                                                </div>
                                            )
                                        })()}
                                        <div className="inv-slot-grid">
                                            {Array.from({ length: 9 }, (_, i) => {
                                                const item = charKinetic[i]
                                                if (!item) return <div key={i} className="inv-item-empty" />
                                                const itemDef = manifestData?.[String(item.itemHash)]
                                                const iconUrl = `https://www.bungie.net${itemDef?.displayProperties?.icon}`
                                                const itemName = itemDef?.displayProperties?.name ?? String(item.itemHash)
                                                return (
                                                    <div key={item.itemInstanceId} className={`inv-item${(item.state & 4) !== 0 ? ' inv-item-masterwork' : ''}`} onClick={() => setSelectedItem(item)}
                                                    >
                                                        <img src={iconUrl} alt={itemName} />
                                                        {(() => {
                                                            const gearTier = itemInstances?.[item.itemInstanceId]?.gearTier
                                                            if (!gearTier) return null
                                                            return (
                                                                <div className="inv-item-tier">
                                                                    {Array.from({ length: 5 }, (_, i) => (
                                                                        <span key={i} className={i < gearTier ? 'tier-pip tier-pip-filled' : 'tier-pip'}>◆</span>
                                                                    ))}
                                                                </div>
                                                            )
                                                        })()}
                                                        {(() => {
                                                            const power = itemInstances?.[item.itemInstanceId]?.primaryStat?.value
                                                            if (!power) return null
                                                            return <span className="inv-item-power">{power}</span>
                                                        })()}
                                                        <div className="inv-item-tooltip">{itemName}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                                {([
                                    { label: "Energy", bucket: bucketHashes.energy, inv: charEnergy },
                                    { label: "Power", bucket: bucketHashes.power, inv: charPower },
                                    { label: "Helmet", bucket: bucketHashes.helmet, inv: charHelmet },
                                    { label: "Gauntlets", bucket: bucketHashes.gauntlets, inv: charGauntlets },
                                    { label: "Chest", bucket: bucketHashes.chest, inv: charChest },
                                    { label: "Legs", bucket: bucketHashes.legs, inv: charLegs },
                                    { label: "Class Item", bucket: bucketHashes.classItem, inv: charClassItem },
                                ] as const).map(({ label, bucket, inv }) => (
                                    <div key={label} className="inv-section">
                                        <p className="inv-section-label">{label}</p>
                                        <div className="inv-slot">
                                            {(() => {
                                                const item = itemArray.find(i => i.bucketHash === bucket)
                                                if (!item) return <div className="inv-item-empty" />
                                                const itemDef = manifestData?.[String(item.itemHash)]
                                                const iconUrl = `https://www.bungie.net${itemDef?.displayProperties?.icon}`
                                                const itemName = itemDef?.displayProperties?.name ?? String(item.itemHash)
                                                return (
                                                    <div key={item.itemInstanceId} className={`inv-item inv-item-equipped${(item.state & 4) !== 0 ? ' inv-item-masterwork' : ''}`} onClick={() => setSelectedItem(item)}>
                                                        <img src={iconUrl} alt={itemName} />
                                                        {(() => {
                                                            const gearTier = itemInstances?.[item.itemInstanceId]?.gearTier
                                                            if (!gearTier) return null
                                                            return (
                                                                <div className="inv-item-tier">
                                                                    {Array.from({ length: 5 }, (_, i) => (
                                                                        <span key={i} className={i < gearTier ? 'tier-pip tier-pip-filled' : 'tier-pip'}>◆</span>
                                                                    ))}
                                                                </div>
                                                            )
                                                        })()}
                                                        {(() => {
                                                            const power = itemInstances?.[item.itemInstanceId]?.primaryStat?.value
                                                            if (!power) return null
                                                            return <span className="inv-item-power">{power}</span>
                                                        })()}
                                                        <div className="inv-item-tooltip">{itemName}</div>
                                                    </div>
                                                )
                                            })()}
                                            <div className="inv-slot-grid">
                                                {Array.from({ length: 9 }, (_, i) => {
                                                    const item = inv[i]
                                                    if (!item) return <div key={i} className="inv-item-empty" />
                                                    const itemDef = manifestData?.[String(item.itemHash)]
                                                    const iconUrl = `https://www.bungie.net${itemDef?.displayProperties?.icon}`
                                                    const itemName = itemDef?.displayProperties?.name ?? String(item.itemHash)
                                                    return (
                                                        <div key={item.itemInstanceId} className={`inv-item${(item.state & 4) !== 0 ? ' inv-item-masterwork' : ''}`} onClick={() => setSelectedItem(item)}>
                                                            <img src={iconUrl} alt={itemName} />
                                                            {(() => {
                                                                const gearTier = itemInstances?.[item.itemInstanceId]?.gearTier
                                                                if (!gearTier) return null
                                                                return (
                                                                    <div className="inv-item-tier">
                                                                        {Array.from({ length: 5 }, (_, i) => (
                                                                            <span key={i} className={i < gearTier ? 'tier-pip tier-pip-filled' : 'tier-pip'}>◆</span>
                                                                        ))}
                                                                    </div>
                                                                )
                                                            })()}
                                                            {(() => {
                                                                const power = itemInstances?.[item.itemInstanceId]?.primaryStat?.value
                                                                if (!power) return null
                                                                return <span className="inv-item-power">{power}</span>
                                                            })()}
                                                            <div className="inv-item-tooltip">{itemName}</div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    })
                )}
            </div>

            <div className="inv-vault">
                <h2>Vault</h2>
                <div className="vault-controls">
                    <input
                        className="vault-search"
                        type="text"
                        placeholder="Search vault..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <select className="vault-sort" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
                        <option value="power-desc">Power ↓</option>
                        <option value="power-asc">Power ↑</option>
                        <option value="name">Name A–Z</option>
                    </select>
                    <select className="vault-sort" value={filterElement ?? ''} onChange={e => setFilterElement(e.target.value ? Number(e.target.value) : null)}>
                        <option value="">All Elements</option>
                        {Object.entries(damageTypes).map(([key, name]) => (
                            <option key={key} value={key}>{name}</option>
                        ))}
                    </select>
                    <select
                        className="vault-sort"
                        value={filterChampion}
                        onChange={e => setFilterChampion(e.target.value)}
                    >
                        <option value="">All Champions</option>
                        <option value="unstoppable">Unstoppable</option>
                        <option value="overload">Overload</option>
                        <option value="anti-barrier">Barrier</option>
                    </select>
                    <button
                        className={`vault-filter-btn${filterExotic ? ' active exotic' : ''}`}
                        onClick={(e) => {
                            (e.currentTarget as HTMLButtonElement).blur()
                            setFilterExotic(f => !f)
                        }}
                    >
                        Exotic
                    </button>
                    <button
                        className={`vault-filter-btn${filterMasterwork ? ' active' : ''}`}
                        onClick={(e) => {
                            (e.currentTarget as HTMLButtonElement).blur()
                            setFilterMasterwork(f => !f)
                        }}
                    >
                        ◆ Masterwork
                    </button>
                    <button
                        className="vault-filter-btn"
                        onClick={(e) => {
                            (e.currentTarget as HTMLButtonElement).blur()
                            setSearchQuery('')
                            setSortBy('power-desc')
                            setFilterMasterwork(false)
                            setFilterExotic(false)
                            setFilterWeaponType(null)
                            setFilterElement(null)
                            setFilterChampion('')
                        }}
                    >
                        ✕ Reset
                    </button>

                </div>
                <div className="vault-chips">
                    {Object.entries(weaponSubTypes).map(([key, name]) => (
                        <button
                            key={key}
                            className={`vault-chip${filterWeaponType === Number(key) ? ' active' : ''}`}
                            onClick={(e) => {
                                (e.currentTarget as HTMLButtonElement).blur()
                                setFilterWeaponType(filterWeaponType === Number(key) ? null : Number(key))
                            }}
                        >
                            {name}
                        </button>
                    ))}
                </div>


                {([
                    { label: "Kinetic", inv: vaultKinetic },
                    { label: "Energy", inv: vaultEnergy },
                    { label: "Power", inv: vaultPower },
                    { label: "Helmet", inv: vaultHelmet },
                    { label: "Gauntlets", inv: vaultGauntlets },
                    { label: "Chest", inv: vaultChest },
                    { label: "Legs", inv: vaultLegs },
                    { label: "Class Item", inv: vaultClassItem },
                ]).map(({ label, inv }) => (
                    <div key={label} className="inv-section">
                        <p className="inv-section-label">{label}</p>
                        <div className="inv-item-list">
                            {isLoading
                                ? Array.from({ length: 8 }, (_, i) => (
                                    <div key={i} className="inv-item skeleton skeleton-item" />
                                ))
                                : inv.map((item) => {
                                    const itemDef = manifestData?.[String(item.itemHash)]
                                    const iconUrl = `https://www.bungie.net${itemDef?.displayProperties?.icon}`
                                    const itemName = itemDef?.displayProperties?.name ?? String(item.itemHash)
                                    return (
                                        <div key={item.itemInstanceId} className={`inv-item${(item.state & 4) !== 0 ? ' inv-item-masterwork' : ''}`} onClick={() => setSelectedItem(item)}>
                                            <img src={iconUrl} alt={itemName} />
                                            {(() => {
                                                const gearTier = itemInstances?.[item.itemInstanceId]?.gearTier
                                                if (!gearTier) return null
                                                return (
                                                    <div className="inv-item-tier">
                                                        {Array.from({ length: 5 }, (_, i) => (
                                                            <span key={i} className={i < gearTier ? 'tier-pip tier-pip-filled' : 'tier-pip'}>◆</span>
                                                        ))}
                                                    </div>
                                                )
                                            })()}
                                            {(() => {
                                                const power = itemInstances?.[item.itemInstanceId]?.primaryStat?.value
                                                if (!power) return null
                                                return <span className="inv-item-power">{power}</span>
                                            })()}
                                            <div className="inv-item-tooltip">{itemName}</div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                ))}

                <h1>Misc</h1>
                <div className="inv-item-list">
                    {vaultMisc.map((item) => {
                        const itemDef = manifestData?.[String(item.itemHash)]
                        const iconUrl = `https://www.bungie.net${itemDef?.displayProperties?.icon}`
                        const itemName = itemDef?.displayProperties?.name ?? String(item.itemHash)
                        return (
                            <div key={item.itemInstanceId || String(item.itemHash)} className="inv-item" onClick={() => setSelectedItem(item)}>
                                <img src={iconUrl} alt={itemName} />
                                {item.quantity > 1 && (
                                    <span className="inv-item-quantity">{item.quantity}</span>
                                )}
                                <div className="inv-item-tooltip">{itemName}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
            {selectedItem && (
                <ItemModal
                    item={selectedItem}
                    itemDef={manifestData?.[String(selectedItem.itemHash)]}
                    instance={itemInstances?.[selectedItem.itemInstanceId] ?? undefined}
                    stats={itemStats?.[selectedItem.itemInstanceId] ?? undefined}
                    sockets={itemSockets?.[selectedItem.itemInstanceId] ?? undefined}
                    plugObjectives={itemPlugObjectives?.[selectedItem.itemInstanceId] ?? undefined}
                    manifestData={manifestData}
                    characters={characters}
                    characterInventory={characterInventory}
                    itemInstances={itemInstances}
                    onRefresh={() => setRefreshKey(k => k + 1)}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div >
    )

}