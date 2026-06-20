import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomeView from './HomeView'

vi.mock('../store/authStore', () => ({
    useAuthStore: vi.fn(() => ({ isAuthenticated: false })),
}))

vi.mock('../components/auth/LoginButton', () => ({
    default: () => <button>Connect with Bungie</button>,
}))

function renderHomeView() {
    return render(
        <MemoryRouter>
            <HomeView />
        </MemoryRouter>
    )
}

describe('HomeView', () => {
    it('renders the TRANSMAT logo text', () => {
        renderHomeView()
        expect(screen.getByText('TRANSMAT')).toBeInTheDocument()
    })

    it('renders the Destiny 2 Inventory Manager tagline', () => {
        renderHomeView()
        expect(screen.getByText('Destiny 2 Inventory Manager')).toBeInTheDocument()
    })

    it('renders the login button', () => {
        renderHomeView()
        expect(screen.getByRole('button', { name: 'Connect with Bungie' })).toBeInTheDocument()
    })

    it('renders the logo symbol ◈', () => {
        renderHomeView()
        expect(screen.getByText('◈')).toBeInTheDocument()
    })
})
