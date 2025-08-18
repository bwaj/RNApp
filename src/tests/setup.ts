import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Node.js globals for testing environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Global test setup and configuration
// Add any global mocks or setup here
