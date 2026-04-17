// Feature: backend-infrastructure, Property 7: DTO validation rejects invalid inputs

import * as fc from 'fast-check'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { RegisterDTO } from './register.dto'
import { LoginDTO } from './login.dto'
import { RefreshDTO } from './refresh.dto'

/**
 * Validates: Requirements 3.2, 3.3, 3.4, 3.5
 *
 * Property 7: DTO validation rejects invalid inputs
 * For any RegisterDTO where any field violates its constraint,
 * class-validator SHALL return at least one validation error for that field.
 */

describe('Property 7: DTO validation rejects invalid inputs', () => {
	// Requirement 3.2: RegisterDTO SHALL require field email validated as a valid email address
	it('RegisterDTO rejects invalid email values', async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate strings that are NOT valid emails (no @ or no domain)
				fc.oneof(
					fc.string({ maxLength: 50 }).filter((s) => !s.includes('@')),
					fc.constant(''),
					fc.constant('notanemail'),
					fc.constant('@nodomain'),
					fc.constant('noatsign.com'),
					fc.constant('spaces in@email.com'),
				),
				async (invalidEmail) => {
					const dto = plainToInstance(RegisterDTO, {
						email: invalidEmail,
						password: 'validpassword123',
						name: 'ValidName',
						phone: '1234567890',
					})
					const errors = await validate(dto)
					const emailErrors = errors.filter((e) => e.property === 'email')
					expect(emailErrors.length).toBeGreaterThan(0)
				},
			),
			{ numRuns: 100 },
		)
	})

	// Requirement 3.3: RegisterDTO SHALL require field password with minimum length of 8 characters
	it('RegisterDTO rejects password shorter than 8 characters', async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate strings with length 0–7
				fc.string({ maxLength: 7 }),
				async (shortPassword) => {
					const dto = plainToInstance(RegisterDTO, {
						email: 'valid@example.com',
						password: shortPassword,
						name: 'ValidName',
						phone: '1234567890',
					})
					const errors = await validate(dto)
					const passwordErrors = errors.filter((e) => e.property === 'password')
					expect(passwordErrors.length).toBeGreaterThan(0)
				},
			),
			{ numRuns: 100 },
		)
	})

	// Requirement 3.4: RegisterDTO SHALL require field name with minimum length of 2 characters
	it('RegisterDTO rejects name shorter than 2 characters', async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate strings with length 0–1
				fc.string({ maxLength: 1 }),
				async (shortName) => {
					const dto = plainToInstance(RegisterDTO, {
						email: 'valid@example.com',
						password: 'validpassword123',
						name: shortName,
						phone: '1234567890',
					})
					const errors = await validate(dto)
					const nameErrors = errors.filter((e) => e.property === 'name')
					expect(nameErrors.length).toBeGreaterThan(0)
				},
			),
			{ numRuns: 100 },
		)
	})

	// Requirement 3.5: RegisterDTO SHALL require field phone with minimum length of 10 characters
	it('RegisterDTO rejects phone shorter than 10 characters', async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate strings with length 0–9
				fc.string({ maxLength: 9 }),
				async (shortPhone) => {
					const dto = plainToInstance(RegisterDTO, {
						email: 'valid@example.com',
						password: 'validpassword123',
						name: 'ValidName',
						phone: shortPhone,
					})
					const errors = await validate(dto)
					const phoneErrors = errors.filter((e) => e.property === 'phone')
					expect(phoneErrors.length).toBeGreaterThan(0)
				},
			),
			{ numRuns: 100 },
		)
	})

	// LoginDTO: invalid email
	it('LoginDTO rejects invalid email values', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.oneof(
					fc.string({ maxLength: 50 }).filter((s) => !s.includes('@')),
					fc.constant(''),
					fc.constant('notanemail'),
					fc.constant('@nodomain'),
				),
				async (invalidEmail) => {
					const dto = plainToInstance(LoginDTO, {
						email: invalidEmail,
						password: 'somepassword',
					})
					const errors = await validate(dto)
					const emailErrors = errors.filter((e) => e.property === 'email')
					expect(emailErrors.length).toBeGreaterThan(0)
				},
			),
			{ numRuns: 100 },
		)
	})

	// LoginDTO: empty password
	it('LoginDTO rejects empty password', async () => {
		const dto = plainToInstance(LoginDTO, {
			email: 'valid@example.com',
			password: '',
		})
		const errors = await validate(dto)
		const passwordErrors = errors.filter((e) => e.property === 'password')
		expect(passwordErrors.length).toBeGreaterThan(0)
	})

	// RefreshDTO: empty refreshToken
	it('RefreshDTO rejects empty refreshToken', async () => {
		const dto = plainToInstance(RefreshDTO, {
			refreshToken: '',
		})
		const errors = await validate(dto)
		const tokenErrors = errors.filter((e) => e.property === 'refreshToken')
		expect(tokenErrors.length).toBeGreaterThan(0)
	})

	// RegisterDTO: valid inputs produce no errors (sanity check)
	it('RegisterDTO accepts valid inputs', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.record({
					email: fc
						.tuple(
							fc.stringMatching(/^[a-z]{3,8}$/),
							fc.stringMatching(/^[a-z]{2,6}$/),
							fc.stringMatching(/^[a-z]{2,4}$/),
						)
						.map(([local, domain, tld]) => `${local}@${domain}.${tld}`),
					password: fc.string({ minLength: 8, maxLength: 30 }),
					name: fc.string({ minLength: 2, maxLength: 50 }),
					phone: fc.string({ minLength: 10, maxLength: 20 }),
				}),
				async ({ email, password, name, phone }) => {
					const dto = plainToInstance(RegisterDTO, { email, password, name, phone })
					const errors = await validate(dto)
					expect(errors.length).toBe(0)
				},
			),
			{ numRuns: 100 },
		)
	})
})
