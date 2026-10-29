import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthScreen } from './AuthScreen'

const { signInWithGoogle } = vi.hoisted(() => ({
  signInWithGoogle: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../firebase/auth', () => ({
  registerWithEmail: vi.fn(),
  signInWithEmail: vi.fn(),
  signInWithGoogle,
}))

describe('AuthScreen', () => {
  it('start de Google-aanmelding vanuit de login- en registratiestroom', async () => {
    render(<AuthScreen />)
    const googleButton = screen.getByRole('button', { name: 'Doorgaan met Google' })
    fireEvent.click(googleButton)
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: 'Registreren' }))
    fireEvent.click(googleButton)
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledTimes(2))
  })
})
