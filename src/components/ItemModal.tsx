import type {
    DestinyItem,
    DestinyItemDefinition,
    DestinyItemInstance,
    DestinyItemStatBlock,
    DestinyItemSocketState,
    DestinyObjectiveProgress,
    DestinyCharacter,
} from "../types/bungie.types"
import {
    statNames,
    statDisplayOrder,
    weaponSubTypes,
    damageTypes,
    classNames,
} from "../types/bungie.types"
import { useState } from "react"
import { createPortal } from "react-dom"
import { useCharacterStore } from '../store/characterStore'
import { useInventoryStore } from '../store/inventoryStore'
import { transferItem, equipItem } from '../services/bungieApi'


interface ItemModalProps {
    item: DestinyItem
    itemDef: DestinyItemDefinition | undefined
    instance: DestinyItemInstance | undefined
    stats: { stats: Record<string, DestinyItemStatBlock> } | undefined
    sockets: { sockets: DestinyItemSocketState[] } | undefined
    plugObjectives: { objectivesPerPlug: Record<string, DestinyObjectiveProgress[]> } | undefined
    manifestData: Record<string, DestinyItemDefinition> | null
    characters: Record<string, DestinyCharacter> | null
    characterInventory: Record<string, DestinyItem[]> | null
    itemInstances: Record<string, DestinyItemInstance> | null
    onRefresh: () => void
    onClose: () => void
}

export function ItemModal({ item, itemDef, instance, stats, sockets, plugObjectives, manifestData, characters, characterInventory, itemInstances, onRefresh, onClose }: ItemModalProps) {
    const [slotTooltip, setSlotTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
    const [transferring, setTransferring] = useState<string | null>(null)

    const { membershipType } = useCharacterStore()
    const { items: equippedItems } = useInventoryStore()

    if (!itemDef) return null

    const name = itemDef.displayProperties.name
    const description = itemDef.displayProperties.description
    const icon = itemDef.displayProperties.icon
    const subTypeName = weaponSubTypes[itemDef.itemSubType] ?? ''
    const power = instance?.primaryStat?.value
    const damageType = instance?.damageType ? damageTypes[instance.damageType] : null
    const isExotic = itemDef.inventory.tierType === 6
    const isMasterwork = (item.state & 4) !== 0

    const itemStatEntries = stats
        ? Object.entries(stats.stats)
            .filter(([hash]) => statNames[Number(hash)])
            .map(([hash, stat]) => ({
                hash: Number(hash),
                name: statNames[Number(hash)],
                value: (stat as DestinyItemStatBlock).value
            }))
            .sort((a, b) => {
                const ai = statDisplayOrder.indexOf(a.hash)
                const bi = statDisplayOrder.indexOf(b.hash)
                return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
            })
        : []

    const visibleSockets = sockets?.sockets.filter(s => s.isVisible && s.plugHash) ?? []

    const perkSockets = visibleSockets.filter(s => {
        const cat = manifestData?.[String(s.plugHash)]?.plug?.plugCategoryIdentifier ?? ''
        return cat !== '' && !cat.includes('masterwork') && !cat.includes('shader') && !cat.includes('ornament') && !cat.includes('mod')
    })

    const catalystSocket = (isExotic && itemDef.itemType === 3) ? visibleSockets.find(s => {
        const cat = manifestData?.[String(s.plugHash)]?.plug?.plugCategoryIdentifier ?? ''
        return cat.includes('masterwork')
    }) : undefined

    const ornamentSockets = visibleSockets.filter(s => {
        const cat = manifestData?.[String(s.plugHash)]?.plug?.plugCategoryIdentifier ?? ''
        return cat.includes('ornament')
    })

    let catalystStatus: string | null = null
    if (catalystSocket) {
        const objectives = plugObjectives?.objectivesPerPlug[String(catalystSocket.plugHash)]
        if (!objectives || objectives.length === 0) catalystStatus = 'Not Unlocked'
        else if (objectives[0].complete) catalystStatus = 'Complete'
        else catalystStatus = `In Progress — ${Math.floor((objectives[0].progress / objectives[0].completionValue) * 100)}%`
    }

    function findItemLocation(instanceId: string): { type: 'character'; charId: string } | { type: 'vault' } {
        if (equippedItems) {
            for (const [charId, charItems] of Object.entries(equippedItems)) {
                if (charItems.some(i => i.itemInstanceId === instanceId)) return { type: 'character', charId }
            }
        }
        if (characterInventory) {
            for (const [charId, charItems] of Object.entries(characterInventory)) {
                if (charItems.some(i => i.itemInstanceId === instanceId)) return { type: 'character', charId }
            }
        }
        return { type: 'vault' }
    }

    async function handleTransfer(destCharId: string) {
        if (!membershipType) return
        const loc = findItemLocation(item.itemInstanceId)
        if (loc.type === 'character' && loc.charId === destCharId) return
        setTransferring(`transfer-${destCharId}`)
        try {
            if (loc.type === 'character') {
                await transferItem(item.itemHash, item.itemInstanceId, loc.charId, membershipType, true)
            }
            await transferItem(item.itemHash, item.itemInstanceId, destCharId, membershipType, false)
            onRefresh()
        } catch (e) {
            console.error('Transfer failed:', e)
        } finally {
            setTransferring(null)
        }
    }

    async function handleEquip(destCharId: string) {
        if (!membershipType) return
        const loc = findItemLocation(item.itemInstanceId)
        setTransferring(`equip-${destCharId}`)
        try {
            if (loc.type === 'vault') {
                await transferItem(item.itemHash, item.itemInstanceId, destCharId, membershipType, false)
            } else if (loc.type === 'character' && loc.charId !== destCharId) {
                await transferItem(item.itemHash, item.itemInstanceId, loc.charId, membershipType, true)
                await transferItem(item.itemHash, item.itemInstanceId, destCharId, membershipType, false)
            }
            await equipItem(item.itemInstanceId, destCharId, membershipType)
            onRefresh()
        } catch (e) {
            console.error('Equip failed:', e)
        } finally {
            setTransferring(null)
        }
    }

    return (
        <div className="item-modal-backdrop" onClick={onClose}>
            <div className="item-modal" onClick={e => e.stopPropagation()}>

                <div className="item-modal-header">
                    <div className="item-modal-header-left">
                        {icon && <img className="item-modal-icon" src={`https://www.bungie.net${icon}`} alt={name} />}
                        <div className="item-modal-title">
                            <span className={`item-modal-name${isMasterwork ? ' item-modal-name-masterwork' : ''}`}>{name}</span>
                            {subTypeName && <span className="item-modal-type">{subTypeName}</span>}
                            <div className="item-modal-meta">
                                {power && <span className="item-modal-power">◆ {power}</span>}
                                {damageType && <span className={`item-modal-element element-${damageType.toLowerCase()}`}>{damageType}</span>}
                            </div>
                        </div>
                    </div>
                    <button className="item-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="item-modal-body">
                    <div className="item-modal-left">
                        {itemStatEntries.length > 0 && (
                            <div className="item-modal-stats">
                                {itemStatEntries.map(({ hash, name, value }) => (
                                    <div key={hash} className="item-tooltip-stat">
                                        <span className="item-tooltip-stat-name">{name}</span>
                                        {name !== 'RPM' && (
                                            <div className="item-tooltip-stat-bar">
                                                <div className="item-tooltip-stat-fill" style={{ width: `${Math.min(value, 100)}%` }} />
                                            </div>
                                        )}
                                        <span className="item-tooltip-stat-value">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {perkSockets.length > 0 && (
                            <div className="item-tooltip-perks">
                                {perkSockets.map((socket, index) => {
                                    const plugDef = manifestData?.[String(socket.plugHash)]
                                    if (!plugDef) return null
                                    return (
                                        <div key={`${socket.plugHash}-${index}`} className="item-tooltip-perk-icon-wrap">
                                            {plugDef.displayProperties.icon && (
                                                <img src={`https://www.bungie.net${plugDef.displayProperties.icon}`} alt={plugDef.displayProperties.name} />
                                            )}
                                            <div className="item-tooltip-perk-sub">
                                                <span className="item-tooltip-perk-name">{plugDef.displayProperties.name}</span>
                                                {plugDef.displayProperties.description && (
                                                    <span className="item-tooltip-perk-desc">{plugDef.displayProperties.description}</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {(catalystSocket || ornamentSockets.length > 0) && (
                            <div className="item-tooltip-perks item-tooltip-perks-special">
                                {catalystSocket && (() => {
                                    const plugDef = manifestData?.[String(catalystSocket.plugHash)]
                                    if (!plugDef) return null
                                    return (
                                        <div className="item-tooltip-perk-icon-wrap">
                                            {plugDef.displayProperties.icon && (
                                                <img src={`https://www.bungie.net${plugDef.displayProperties.icon}`} alt={plugDef.displayProperties.name} />
                                            )}
                                            <div className="item-tooltip-perk-sub">
                                                <span className="item-tooltip-catalyst-label">Catalyst — <span className={catalystStatus === 'Complete' ? 'complete' : ''}>{catalystStatus}</span></span>
                                                <span className="item-tooltip-perk-name">{plugDef.displayProperties.name}</span>
                                                {plugDef.displayProperties.description && (
                                                    <span className="item-tooltip-perk-desc">{plugDef.displayProperties.description}</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })()}
                                {ornamentSockets.map((socket, index) => {
                                    const plugDef = manifestData?.[String(socket.plugHash)]
                                    if (!plugDef) return null
                                    return (
                                        <div key={`${socket.plugHash}-${index}`} className="item-tooltip-perk-icon-wrap">
                                            {plugDef.displayProperties.icon && (
                                                <img src={`https://www.bungie.net${plugDef.displayProperties.icon}`} alt={plugDef.displayProperties.name} />
                                            )}
                                            <div className="item-tooltip-perk-sub">
                                                <span className="item-tooltip-perk-name">{plugDef.displayProperties.name}</span>
                                                {plugDef.displayProperties.description && (
                                                    <span className="item-tooltip-perk-desc">{plugDef.displayProperties.description}</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {description && <p className="item-tooltip-flavor">{description}</p>}
                    </div>

                    <div className="item-modal-destinations">
                        {characters && Object.entries(characters).map(([charId, char]) => (
                            <div key={charId} className="item-modal-destination">
                                <img
                                    className="item-modal-char-emblem"
                                    src={`https://www.bungie.net${char.emblemBackgroundPath}`}
                                    alt={classNames[char.classType]}
                                />
                                <span className="item-modal-char-name">{classNames[char.classType]}</span>
                                {(() => {
                                    const bucketHash = itemDef.inventory.bucketTypeHash
                                    const inv = characterInventory?.[charId] ?? []
                                    const bucketItems = inv.filter(i => {
                                        const def = manifestData?.[String(i.itemHash)]
                                        return def?.inventory.bucketTypeHash === bucketHash
                                    })
                                    return (
                                        <div className="item-modal-slot-grid">
                                            {Array.from({ length: 9 }, (_, i) => {
                                                const slotItem = bucketItems[i]
                                                const slotDef = slotItem ? manifestData?.[String(slotItem.itemHash)] : undefined
                                                if (!slotDef?.displayProperties.icon) return <div key={i} className="item-modal-slot" />
                                                const slotInstance = itemInstances?.[slotItem.itemInstanceId]
                                                const slotPower = slotInstance?.primaryStat?.value
                                                const slotGearTier = slotInstance?.gearTier
                                                const slotMW = (slotItem.state & 4) !== 0
                                                const slotName = slotDef.displayProperties.name
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`item-modal-slot${slotMW ? ' inv-item-masterwork' : ''}`}
                                                        onMouseEnter={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect()
                                                            setSlotTooltip({ text: slotName, x: rect.left + rect.width / 2, y: rect.top })
                                                        }}
                                                        onMouseLeave={() => setSlotTooltip(null)}
                                                    >
                                                        <img
                                                            className="item-modal-slot-filled"
                                                            src={`https://www.bungie.net${slotDef.displayProperties.icon}`}
                                                            alt={slotName}
                                                        />
                                                        {slotGearTier && (
                                                            <div className="inv-item-tier">
                                                                {Array.from({ length: 5 }, (_, j) => (
                                                                    <span key={j} className={j < slotGearTier ? 'tier-pip tier-pip-filled' : 'tier-pip'}>◆</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {slotPower && <span className="inv-item-power">{slotPower}</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                })()}
                                <div className="item-modal-destination-actions">
                                    <button
                                        className="item-modal-action-btn"
                                        onClick={() => handleTransfer(charId)}
                                        disabled={transferring !== null}
                                    >
                                        {transferring === `transfer-${charId}` ? '...' : 'Transfer'}
                                    </button>
                                    <button
                                        className="item-modal-action-btn"
                                        onClick={() => handleEquip(charId)}
                                        disabled={transferring !== null}
                                    >
                                        {transferring === `equip-${charId}` ? '...' : 'Equip'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="item-modal-destination">
                            <div className="item-modal-vault-emblem">◈</div>
                            <span className="item-modal-char-name">Vault</span>
                            <div className="item-modal-destination-actions">
                                <button
                                    className="item-modal-action-btn"
                                    onClick={async () => {
                                        if (!membershipType) return
                                        const loc = findItemLocation(item.itemInstanceId)
                                        if (loc.type === 'vault') return
                                        setTransferring('transfer-vault')
                                        try {
                                            await transferItem(item.itemHash, item.itemInstanceId, loc.charId, membershipType, true)
                                            onRefresh()
                                        } catch (e) {
                                            console.error('Transfer to vault failed:', e)
                                        } finally {
                                            setTransferring(null)
                                        }
                                    }}
                                    disabled={transferring !== null}
                                >
                                    {transferring === 'transfer-vault' ? '...' : 'Transfer'}
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {slotTooltip && createPortal(
                <div className="inv-item-tooltip" style={{
                    display: 'block',
                    position: 'fixed',
                    left: slotTooltip.x,
                    top: slotTooltip.y,
                    transform: 'translateX(-50%) translateY(calc(-100% - 6px))',
                    bottom: 'auto',
                }}>
                    {slotTooltip.text}
                </div>,
                document.body
            )}
        </div>
    )
}
