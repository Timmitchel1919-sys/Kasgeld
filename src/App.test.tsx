import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('Kasgeld dashboard', () => {
  beforeEach(() => localStorage.clear())

  it('toont de primaire dashboardonderdelen en vergrendelde maand', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Kasgeld Applicatie' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Draai aan het maandrad' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Maandoverzicht' })).toBeInTheDocument()
    expect(screen.getByText('Toegewezen aan Shaquil')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Automatische meldingen' })).toBeInTheDocument()
  })

  it('voegt een deelnemer toe en bewaart deze lokaal', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Deelnemer toevoegen' }).at(-1)!)
    fireEvent.change(screen.getByPlaceholderText('Volledige naam'), { target: { value: 'Naomi' } })
    fireEvent.change(screen.getByPlaceholderText('+597 8...'), { target: { value: '+597 8123456' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Deelnemer toevoegen' }).at(-1)!)
    expect(screen.getByText('Naomi')).toBeInTheDocument()
    expect(localStorage.getItem('kasgeld-participants')).toContain('Naomi')
  })

  it('schakelt automatische meldingen uit', () => {
    render(<App />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText('Uit')).toBeInTheDocument()
  })

  it('draait het maandrad en registreert daarna activiteit', () => {
    vi.useFakeTimers()
    render(<App />)
    const spin = screen.getByRole('button', { name: /DRAAI/ })
    fireEvent.click(spin)
    expect(spin).toBeDisabled()
    act(() => vi.advanceTimersByTime(1800))
    expect(screen.getByText('April blijft geregistreerd')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
