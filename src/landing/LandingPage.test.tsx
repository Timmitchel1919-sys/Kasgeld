import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('toont de volledige productstructuur en verbindt beide authenticatie-CTA’s', () => {
    const onLogin = vi.fn()
    const onRegister = vi.fn()
    render(<LandingPage onLogin={onLogin} onRegister={onRegister} />)

    expect(screen.getByRole('heading', { name: /Samen sparen/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Zo werkt het' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'De voordelen van Kasgeld' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Veilig en betrouwbaar ingericht' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ik heb al een account' }))
    fireEvent.click(screen.getByRole('button', { name: /Start je kasgeldgroep/ }))
    expect(onLogin).toHaveBeenCalledOnce()
    expect(onRegister).toHaveBeenCalledOnce()
  })
})
