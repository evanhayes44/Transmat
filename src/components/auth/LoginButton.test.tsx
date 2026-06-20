import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginButton from './LoginButton'
import * as authService from '../../services/auth'

vi.mock('../../services/auth', () => ({
    redirectToBungieLogin: vi.fn(),
}))

describe('LoginButton', () => {
    it('renders the Connect with Bungie label', () => {
        render(<LoginButton />)
        expect(screen.getByRole('button', { name: 'Connect with Bungie' })).toBeInTheDocument()
    })

    it('calls redirectToBungieLogin when clicked', () => {
        render(<LoginButton />)
        fireEvent.click(screen.getByRole('button', { name: 'Connect with Bungie' }))
        expect(authService.redirectToBungieLogin).toHaveBeenCalledOnce()
    })

    it('applies an extra className when provided', () => {
        render(<LoginButton className="extra-class" />)
        const button = screen.getByRole('button', { name: 'Connect with Bungie' })
        expect(button.className).toContain('extra-class')
    })
})
