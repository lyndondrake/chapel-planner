<script lang="ts">
	import { ServiceTypeLabels } from '$lib/types/enums';
	import { formatTime } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	const serviceTypeColours: Record<string, string> = {
		sunday_evensong: 'bg-purple-900 text-purple-200',
		thursday_compline: 'bg-indigo-900 text-indigo-200',
		choral_eucharist: 'bg-amber-900 text-amber-200',
		said_eucharist: 'bg-yellow-900 text-yellow-200',
		choral_matins: 'bg-sky-900 text-sky-200',
		morning_prayer: 'bg-cyan-900 text-cyan-200',
		evening_prayer: 'bg-blue-900 text-blue-200',
		gaudy_evensong: 'bg-fuchsia-900 text-fuchsia-200',
		feast_day: 'bg-red-900 text-red-200',
		wedding: 'bg-pink-900 text-pink-200',
		other: 'bg-surface-700 text-surface-200'
	};

	function getColour(serviceType: string) {
		return serviceTypeColours[serviceType] ?? serviceTypeColours.other;
	}

	// Build calendar grid
	const calendarDays = $derived.by(() => {
		const firstOfMonth = new Date(data.year, data.month - 1, 1);
		const daysInMonth = new Date(data.year, data.month, 0).getDate();
		// Monday = 0, Sunday = 6
		let startDay = firstOfMonth.getDay() - 1;
		if (startDay < 0) startDay = 6;

		const days: { date: number | null; dateStr: string }[] = [];

		// Padding for days before the 1st
		for (let i = 0; i < startDay; i++) {
			days.push({ date: null, dateStr: '' });
		}

		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			days.push({ date: d, dateStr });
		}

		return days;
	});

	// Group services by date
	const servicesByDate = $derived.by(() => {
		const map: Record<string, typeof data.services> = {};
		for (const svc of data.services) {
			if (!map[svc.date]) map[svc.date] = [];
			map[svc.date].push(svc);
		}
		return map;
	});

	const prevMonth = $derived.by(() => {
		if (data.month === 1) return { year: data.year - 1, month: 12 };
		return { year: data.year, month: data.month - 1 };
	});

	const nextMonth = $derived.by(() => {
		if (data.month === 12) return { year: data.year + 1, month: 1 };
		return { year: data.year, month: data.month + 1 };
	});

	const todayStr = new Date().toISOString().split('T')[0];
</script>

<svelte:head>
	<title>{monthNames[data.month - 1]} {data.year} — Calendar — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Calendar</h1>
		<div class="flex items-center gap-3">
			<a
				href="/calendar?year={prevMonth.year}&month={prevMonth.month}"
				class="text-surface-400 hover:text-surface-200 rounded border border-surface-600 px-3 py-1"
			>&larr;</a>
			<span class="text-lg font-semibold">{monthNames[data.month - 1]} {data.year}</span>
			<a
				href="/calendar?year={nextMonth.year}&month={nextMonth.month}"
				class="text-surface-400 hover:text-surface-200 rounded border border-surface-600 px-3 py-1"
			>&rarr;</a>
		</div>
	</div>

	<div class="overflow-hidden rounded-lg border border-surface-700">
		<!-- Day headers -->
		<div class="grid grid-cols-7 bg-surface-800">
			{#each dayNames as day}
				<div class="border-b border-surface-700 px-2 py-2 text-center text-xs font-medium text-surface-400">{day}</div>
			{/each}
		</div>

		<!-- Calendar grid -->
		<div class="grid grid-cols-7">
			{#each calendarDays as cell}
				<div class="min-h-24 border-b border-r border-surface-700 p-1 {cell.dateStr === todayStr ? 'bg-surface-800' : ''}">
					{#if cell.date}
						<div class="mb-1 text-right text-xs {cell.dateStr === todayStr ? 'font-bold text-primary-400' : 'text-surface-400'}">
							{cell.date}
						</div>
						{#if servicesByDate[cell.dateStr]}
							<div class="space-y-0.5">
								{#each servicesByDate[cell.dateStr] as svc}
									<a
										href="/services/{svc.id}"
										class="block truncate rounded px-1 py-0.5 text-xs {getColour(svc.serviceType)}"
										title="{ServiceTypeLabels[svc.serviceType as keyof typeof ServiceTypeLabels] ?? svc.serviceType}: {svc.title || svc.liturgicalDay || ''} {svc.time ? formatTime(svc.time) : ''}"
									>
										{#if svc.time}
											<span class="font-medium">{formatTime(svc.time)}</span>
										{/if}
										{svc.title || ServiceTypeLabels[svc.serviceType as keyof typeof ServiceTypeLabels] || svc.serviceType}
									</a>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Legend -->
	<div class="flex flex-wrap gap-2 text-xs">
		{#each Object.entries(serviceTypeColours) as [type, cls]}
			{#if type !== 'other'}
				<span class="rounded px-2 py-0.5 {cls}">
					{ServiceTypeLabels[type as keyof typeof ServiceTypeLabels] ?? type}
				</span>
			{/if}
		{/each}
	</div>
</div>
