import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NotFoundPage from '@/pages/NotFoundPage'

describe('NotFoundPage', () => {
  it('renders 404 heading', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    )
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders link to home', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    )
    expect(screen.getByText('На главную')).toBeInTheDocument()
  })
})
