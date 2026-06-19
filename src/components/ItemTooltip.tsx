import type { DestinyItemDefinition, DestinyItemInstance, DestinyItemStatBlock, DestinyItemSocketState, DestinyObjectiveProgress } from "../types/bungie.types"
import { statNames, statDisplayOrder, weaponSubTypes, damageTypes } from "../types/bungie.types"

interface ItemTooltipProps {
    itemDef: DestinyItemDefinition | undefined
    instance: DestinyItemInstance | undefined
    stats: { stats: Record<string, DestinyItemStatBlock> } | undefined
    sockets: { sockets: DestinyItemSocketState[] } | undefined
    plugObjectives: { objectivesPerPlug: Record<string, DestinyObjectiveProgress[]> } | undefined
    manifestData: Record<string, DestinyItemDefinition> | null
}


export function ItemTooltip({ itemDef, instance, stats, sockets, plugObjectives, manifestData }: ItemTooltipProps) {
    if (!itemDef) return null

    const name = itemDef.displayProperties.name
    const description = itemDef.displayProperties.description
    const subTypeName = weaponSubTypes[itemDef.itemSubType] ?? ''
    const power = instance?.primaryStat?.value
    const damageType = instance?.damageType ? damageTypes[instance.damageType] : null
    const isExotic = itemDef.inventory.tierType === 6

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


    return (
        <div className="item-tooltip">
            <div className="item-tooltip-header">
                <span className="item-tooltip-name">{name}</span>
                {subTypeName && <span className="item-tooltip-type">{subTypeName}</span>}
            </div>

            {(power || damageType) && (
                <div className="item-tooltip-meta">
                    {power && <span className="item-tooltip-power">◆ {power}</span>}
                    {damageType && <span className={`item-tooltip-element element-${damageType.toLowerCase()}`}>{damageType}</span>}
                </div>
            )}

            {itemStatEntries.length > 0 && (
                <div className="item-tooltip-stats">
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
    )
}
