/**
 * Easter computus and liturgical season derivation.
 *
 * Uses the Anonymous Gregorian algorithm (Meeus/Jones/Butcher) to compute
 * the date of Easter Sunday for a given year.
 */

export function computeEaster(year: number): Date {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31);
	const day = ((h + l - 7 * m + 114) % 31) + 1;

	return new Date(year, month - 1, day);
}

/** Add days to a date, returning a new Date. */
function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

/** Format a Date as ISO date string (YYYY-MM-DD). */
export function toISODate(date: Date): string {
	return date.toISOString().split('T')[0];
}

/**
 * Key liturgical dates derived from Easter for a given year.
 */
export function getLiturgicalDates(year: number) {
	const easter = computeEaster(year);

	return {
		// Pre-Lent / Lent
		ashWednesday: addDays(easter, -46),
		palmSunday: addDays(easter, -7),
		maundyThursday: addDays(easter, -3),
		goodFriday: addDays(easter, -2),
		holySaturday: addDays(easter, -1),

		// Easter
		easterDay: easter,
		easterMonday: addDays(easter, 1),

		// Post-Easter
		ascensionDay: addDays(easter, 39),
		pentecost: addDays(easter, 49),
		trinitySunday: addDays(easter, 56),

		// Advent (four Sundays before Christmas)
		adventSunday: getAdventSunday(year),

		// Fixed dates
		christmas: new Date(year, 11, 25),
		epiphany: new Date(year, 0, 6),
		allSaints: new Date(year, 10, 1),
		candlemas: new Date(year, 1, 2)
	};
}

/**
 * Advent Sunday: the Sunday nearest to St Andrew's Day (30 November),
 * which is the fourth Sunday before Christmas Day.
 */
function getAdventSunday(year: number): Date {
	const christmas = new Date(year, 11, 25);
	const dayOfWeek = christmas.getDay();
	// Days from Sunday: 0=Sun, 1=Mon, etc.
	// Fourth Sunday before Christmas
	const daysBack = dayOfWeek === 0 ? 28 : dayOfWeek + 21;
	return addDays(christmas, -daysBack);
}

/**
 * Determine the liturgical season for a given date.
 */
export function getLiturgicalSeason(
	date: Date,
	year?: number
): { season: string; colour: string } {
	const y = year ?? date.getFullYear();
	const dates = getLiturgicalDates(y);
	const d = date.getTime();

	// Use previous year's dates if before Epiphany
	if (date.getMonth() === 0 && date.getDate() < 6) {
		const prevDates = getLiturgicalDates(y - 1);
		if (d < new Date(y, 0, 6).getTime()) {
			return { season: 'christmas', colour: 'white' };
		}
	}

	// Advent
	if (d >= dates.adventSunday.getTime()) {
		if (d < new Date(y, 11, 25).getTime()) {
			return { season: 'advent', colour: 'purple' };
		}
		return { season: 'christmas', colour: 'white' };
	}

	// Christmas to Epiphany (after Christmas)
	if (date.getMonth() === 11 && date.getDate() >= 25) {
		return { season: 'christmas', colour: 'white' };
	}

	// Epiphany season
	const epiphany = dates.epiphany;
	const candlemas = dates.candlemas;
	if (d >= epiphany.getTime() && d <= candlemas.getTime()) {
		return { season: 'epiphany', colour: 'white' };
	}

	// Lent
	if (d >= dates.ashWednesday.getTime() && d < dates.palmSunday.getTime()) {
		return { season: 'lent', colour: 'purple' };
	}

	// Holy Week
	if (d >= dates.palmSunday.getTime() && d < dates.easterDay.getTime()) {
		return { season: 'holy_week', colour: 'red' };
	}

	// Easter
	if (d >= dates.easterDay.getTime() && d < dates.ascensionDay.getTime()) {
		return { season: 'easter', colour: 'white' };
	}

	// Ascension to Pentecost
	if (d >= dates.ascensionDay.getTime() && d < dates.pentecost.getTime()) {
		return { season: 'ascension', colour: 'white' };
	}

	// Pentecost
	if (
		d >= dates.pentecost.getTime() &&
		d < dates.trinitySunday.getTime()
	) {
		return { season: 'pentecost', colour: 'red' };
	}

	// Trinity / Ordinary Time (after Trinity Sunday until Kingdom season)
	// Kingdom season: last four Sundays before Advent
	if (d >= dates.trinitySunday.getTime() && d < dates.adventSunday.getTime()) {
		// Rough heuristic: last ~4 weeks before Advent = Kingdom
		const kingdomStart = addDays(dates.adventSunday, -28);
		if (d >= kingdomStart.getTime()) {
			return { season: 'kingdom', colour: 'red' };
		}
		return { season: 'ordinary_time', colour: 'green' };
	}

	// Default: ordinary time (between Candlemas and Ash Wednesday)
	return { season: 'ordinary_time', colour: 'green' };
}

/**
 * Determine the RCL liturgical year for a given date.
 * Year A when year % 3 === 1, B when === 2, C when === 0.
 * The liturgical year begins on Advent Sunday.
 */
export function getLiturgicalYear(date: Date): 'A' | 'B' | 'C' {
	let year = date.getFullYear();
	const adventSunday = getAdventSunday(year);

	// If before Advent Sunday, use the previous year's cycle
	if (date < adventSunday) {
		year = year - 1;
	}

	// The liturgical year that begins in year N uses:
	// N+1 mod 3: 0 → C, 1 → A, 2 → B
	const mod = (year + 1) % 3;
	if (mod === 1) return 'A';
	if (mod === 2) return 'B';
	return 'C';
}
