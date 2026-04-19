/**
 * Shared formatting utilities for dates and currency.
 * Centralised here so every layer can import from @/shared/lib/formatters.
 */

const DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
})

const CURRENCY_FORMATTER = new Intl.NumberFormat('ru-RU', {
	style: 'currency',
	currency: 'RUB',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
})

/**
 * Formats an ISO date string to a localised date (dd.mm.yyyy).
 *
 * @example formatDate('2024-03-15T10:00:00Z') // '15.03.2024'
 */
export function formatDate(iso: string): string {
	return DATE_FORMATTER.format(new Date(iso))
}

/**
 * Formats a numeric value as Russian Ruble currency.
 *
 * @example formatCurrency(1500.5) // '1 500,50 ₽'
 */
export function formatCurrency(value: number): string {
	return CURRENCY_FORMATTER.format(value)
}
