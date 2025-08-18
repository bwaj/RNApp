import { render, screen } from '@/tests/utils'
import Page from '../page'

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Page />)
    expect(screen.getByText(/get started by editing/i)).toBeInTheDocument()
  })

  it('has deploy button', () => {
    render(<Page />)
    expect(screen.getByText('Deploy now')).toBeInTheDocument()
  })
})
