const request = require('supertest')

// Prueba básica de ejemplo para que Jest funcione
describe('API Tests', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  test('should test basic math operations', () => {
    expect(2 * 3).toBe(6)
    expect(10 / 2).toBe(5)
  })
})

// Ejemplo de test para una función de utilidad
describe('Utility Functions Tests', () => {
  test('should validate email format', () => {
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('user@domain.co')).toBe(true)
  })

  test('should hash password correctly', () => {
    const bcrypt = require('bcrypt')

    const password = 'testpassword'
    const hashedPassword = bcrypt.hashSync(password, 10)

    expect(bcrypt.compareSync(password, hashedPassword)).toBe(true)
    expect(bcrypt.compareSync('wrongpassword', hashedPassword)).toBe(false)
  })
})
