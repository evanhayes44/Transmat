import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ItemModal } from './ItemModal'
import type { DestinyItem, DestinyItemDefinition, DestinyItemInstance } from '../types/bungie.types'

vi.mock('../store/characterStore', () => ({
    useCharacterStore: () => ({ membershipType: 2 }),
}))

vi.mock('../store/inventoryStore', () => ({
    useInventoryStore: () => ({ items: null }),
}))

vi.mock('../services/bungieApi', () => ({
    transferItem: vi.fn(),
    equipItem: vi.fn(),
}))

const mockItemDef: DestinyItemDefinition = {
    displayProperties: {
        name: 'Gjallarhorn',
        icon: '/img/gjallarhorn.png',
        description: 'Where wolf rockets howl.',
    },
    itemType: 3,
    itemSubType: 10,
    inventory: {
        bucketTypeHash: 953998645,
        tierType: 6,
    },
}

const mockItem: DestinyItem = {
    itemHash: 1274330687,
    itemInstanceId: 'inst-1',
    quantity: 1,
    bucketHash: 953998645,
    state: 0,
}

const mockInstance: DestinyItemInstance = {
    gearTier: 5,
    primaryStat: { value: 1820 },
    damageType: 4,
}

const baseProps = {
    item: mockItem,
    itemDef: mockItemDef,
    instance: mockInstance,
    stats: undefined,
    sockets: undefined,
    plugObjectives: undefined,
    manifestData: null,
    characters: null,
    characterInventory: null,
    itemInstances: null,
    onRefresh: vi.fn(),
    onClose: vi.fn(),
}

describe('ItemModal', () => {
    it('renders nothing when itemDef is undefined', () => {
        const { container } = render(
            <ItemModal {...baseProps} itemDef={undefined} onClose={vi.fn()} onRefresh={vi.fn()} />
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('renders the item name', () => {
        render(<ItemModal {...baseProps} onClose={vi.fn()} onRefresh={vi.fn()} />)
        expect(screen.getByText('Gjallarhorn')).toBeInTheDocument()
    })

    it('renders the weapon sub-type', () => {
        render(<ItemModal {...baseProps} onClose={vi.fn()} onRefresh={vi.fn()} />)
        expect(screen.getByText('Rocket Launcher')).toBeInTheDocument()
    })

    it('renders the power level', () => {
        render(<ItemModal {...baseProps} onClose={vi.fn()} onRefresh={vi.fn()} />)
        expect(screen.getByText('◆ 1820')).toBeInTheDocument()
    })

    it('calls onClose when the close button is clicked', () => {
        const onClose = vi.fn()
        render(<ItemModal {...baseProps} onClose={onClose} onRefresh={vi.fn()} />)
        fireEvent.click(screen.getByText('✕'))
        expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onClose when the backdrop is clicked', () => {
        const onClose = vi.fn()
        const { container } = render(<ItemModal {...baseProps} onClose={onClose} onRefresh={vi.fn()} />)
        // The outermost div is the backdrop — click it directly
        fireEvent.click(container.firstChild!)
        expect(onClose).toHaveBeenCalledOnce()
    })

    it('renders a Vault transfer destination', () => {
        render(<ItemModal {...baseProps} onClose={vi.fn()} onRefresh={vi.fn()} />)
        expect(screen.getByText('Vault')).toBeInTheDocument()
    })
})
