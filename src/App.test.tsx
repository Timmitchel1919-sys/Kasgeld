import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./auth/AuthContext', () => ({
  useAuth: () => ({ user: null, configured: false, signOut: vi.fn() }),
}))

const renderApp = () => render(<App />)

describe('Kasgeld dashboard', () => {
  beforeEach(() => localStorage.clear())

  it('toont de primaire dashboardonderdelen en vergrendelde maand', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'Kasgeld' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Draai aan het maandrad' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Maandoverzicht' })).toBeInTheDocument()
    expect(screen.getByText('Toegewezen aan Shaquil')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Automatische meldingen' })).not.toBeInTheDocument()
  })

  it('voegt een deelnemer toe en bewaart deze lokaal', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Deelnemers' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Deelnemer toevoegen' }).at(-1)!)
    fireEvent.change(screen.getByPlaceholderText('Volledige naam'), { target: { value: 'Naomi' } })
    fireEvent.change(screen.getByPlaceholderText('+597 8...'), { target: { value: '+597 8123456' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Deelnemer toevoegen' }).at(-1)!)
    expect(screen.getByText('Naomi')).toBeInTheDocument()
    expect(localStorage.getItem('kasgeld-participants')).toContain('Naomi')
  })

  it('schakelt automatische meldingen uit', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Instellingen' }))
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText('Uit')).toBeInTheDocument()
  })

  it('draait het maandrad en registreert daarna activiteit', () => {
    vi.useFakeTimers()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /Rad resetten/ }))
    const spin = screen.getByRole('button', { name: /DRAAI/ })
    fireEvent.click(spin)
    expect(spin).toBeDisabled()
    act(() => vi.advanceTimersByTime(1800))
    fireEvent.click(screen.getByRole('button', { name: 'Meldingen' }))
    expect(screen.getByText(/is toegewezen en vergrendeld/)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('toont adminmodules in de gevraagde sidebarvolgorde', () => {
    renderApp()
    const navigation = screen.getByRole('navigation', { name: 'Hoofdnavigatie' })
    expect(Array.from(navigation.querySelectorAll('button')).map(button => button.textContent)).toEqual(['Dashboard', 'Deelnemers', 'Meldingen', 'Instellingen'])
  })

  it('opent het eigen profielpaneel met de uitlogactie', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /Mijn profiel/ }))
    expect(screen.getByLabelText('Mijn profiel')).toHaveTextContent('sheq97@gmail.com')
    expect(screen.getByRole('button', { name: 'Uitloggen' })).toBeInTheDocument()
  })

  it('klapt de sidebar in en opent hem opnieuw via het logo', () => {
    renderApp()
    const sidebar = screen.getByRole('complementary')
    fireEvent.click(screen.getByRole('button', { name: 'Sidebar inklappen' }))
    expect(sidebar).toHaveClass('collapsed')
    fireEvent.click(screen.getByRole('button', { name: 'Sidebar openen' }))
    expect(sidebar).not.toHaveClass('collapsed')
  })
})
