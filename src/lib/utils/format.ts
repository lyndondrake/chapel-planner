export function formatPersonName(person: {
	title?: string | null;
	firstName: string;
	lastName: string;
	preferredName?: string | null;
	suffix?: string | null;
}): string {
	const parts: string[] = [];
	if (person.title) parts.push(person.title);
	parts.push(person.preferredName || person.firstName);
	parts.push(person.lastName);
	if (person.suffix) parts.push(person.suffix);
	return parts.join(' ');
}

export function formatDate(isoDate: string): string {
	const date = new Date(isoDate + 'T00:00:00');
	return date.toLocaleDateString('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

export function formatTime(time: string | null | undefined): string {
	if (!time) return '';
	const [h, m] = time.split(':');
	const hour = parseInt(h, 10);
	const suffix = hour >= 12 ? 'pm' : 'am';
	const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
	return `${displayHour}:${m}${suffix}`;
}
