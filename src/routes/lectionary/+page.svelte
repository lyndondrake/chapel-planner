<script lang="ts">
	import { ReadingTypeLabels, ServiceContextLabels } from '$lib/types/enums';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const colourDisplay: Record<string, { label: string; class: string }> = {
		white: { label: 'White', class: 'bg-white text-black' },
		gold: { label: 'Gold', class: 'bg-yellow-500 text-black' },
		red: { label: 'Red', class: 'bg-red-700 text-white' },
		green: { label: 'Green', class: 'bg-green-700 text-white' },
		purple: { label: 'Purple', class: 'bg-purple-700 text-white' },
		blue: { label: 'Blue', class: 'bg-blue-700 text-white' },
		rose: { label: 'Rose', class: 'bg-pink-400 text-black' },
		black: { label: 'Black', class: 'bg-black text-white' },
		unbleached_linen: { label: 'Unbleached Linen', class: 'bg-amber-100 text-black' }
	};

	const seasonLabels: Record<string, string> = {
		advent: 'Advent',
		christmas: 'Christmas',
		epiphany: 'Epiphany',
		lent: 'Lent',
		holy_week: 'Holy Week',
		easter: 'Easter',
		ascension: 'Ascension',
		pentecost: 'Pentecost',
		trinity: 'Trinity',
		ordinary_time: 'Ordinary Time',
		kingdom: 'Kingdom'
	};

	const yearLabels: Record<string, string> = {
		A: 'Year A (Matthew)',
		B: 'Year B (Mark)',
		C: 'Year C (Luke)'
	};

	// Preferred display order for service contexts
	const contextOrder = [
		'principal',
		'morning_prayer',
		'evening_prayer',
		'second_service',
		'third_service',
		'daily_eucharist'
	];

	function sortedContexts(groups: Record<string, unknown[]>): string[] {
		const keys = Object.keys(groups);
		return keys.sort((a, b) => {
			const ai = contextOrder.indexOf(a);
			const bi = contextOrder.indexOf(b);
			return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
		});
	}

	function contextLabel(ctx: string): string {
		return ServiceContextLabels[ctx as keyof typeof ServiceContextLabels] ?? ctx;
	}

	function hasReadings(groups: Record<string, unknown[]>): boolean {
		return Object.values(groups).some((arr) => arr.length > 0);
	}
</script>

<svelte:head>
	<title>Lectionary — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-3xl font-bold">Lectionary</h1>

	<!-- Date picker and tradition selector -->
	<form method="GET" class="flex flex-wrap items-end gap-4">
		<div>
			<label for="date" class="mb-1 block text-sm font-medium">Date</label>
			<input type="date" id="date" name="date" value={data.date} class="input rounded border border-surface-300 bg-surface-100 px-3 py-2" />
		</div>
		<div>
			<label for="tradition" class="mb-1 block text-sm font-medium">Tradition</label>
			<select id="tradition" name="tradition" class="input rounded border border-surface-300 bg-surface-100 px-3 py-2">
				<option value="cw" selected={data.tradition === 'cw'}>Common Worship</option>
				<option value="bcp" selected={data.tradition === 'bcp'}>Book of Common Prayer</option>
			</select>
		</div>
		<button type="submit" class="preset-filled-primary-500 rounded px-4 py-2">Look Up</button>
	</form>

	<!-- Occasion info -->
	{#if data.occasion}
		<div class="border-surface-300 rounded border p-6">
			<div class="mb-4 flex flex-wrap items-center gap-3">
				<h2 class="text-2xl font-bold">{data.occasion.name}</h2>
				{#if data.occasion.colour && colourDisplay[data.occasion.colour]}
					<span class="rounded px-2 py-0.5 text-xs font-medium {colourDisplay[data.occasion.colour].class}">
						{colourDisplay[data.occasion.colour].label}
					</span>
				{/if}
			</div>
			<div class="text-surface-500 flex flex-wrap gap-4 text-sm">
				{#if data.occasion.season}
					<span>Season: {seasonLabels[data.occasion.season] ?? data.occasion.season}</span>
				{/if}
				{#if data.occasion.liturgicalYear}
					<span>{yearLabels[data.occasion.liturgicalYear] ?? `Year ${data.occasion.liturgicalYear}`}</span>
				{/if}
			</div>
		</div>

		<!-- Primary tradition readings grouped by context -->
		<div>
			<h3 class="mb-3 text-lg font-semibold">
				{data.tradition === 'cw' ? 'Common Worship' : 'Book of Common Prayer'}
			</h3>
			{#if hasReadings(data.groups)}
				<div class="space-y-6">
					{#each sortedContexts(data.groups) as ctx}
						{@const readings = data.groups[ctx]}
						{#if readings && readings.length > 0}
							<div>
								<h4 class="text-surface-600 mb-2 text-sm font-semibold uppercase tracking-wide">
									{contextLabel(ctx)}
								</h4>
								<div class="space-y-2">
									{#each readings as reading}
										<div class="border-surface-300 flex items-baseline gap-3 rounded border p-3">
											<span class="text-surface-500 w-28 shrink-0 text-sm">
												{ReadingTypeLabels[reading.readingType as keyof typeof ReadingTypeLabels] ?? reading.readingType}
											</span>
											<span class="font-medium">{reading.reference}</span>
											{#if reading.alternateYear}
												<span class="text-surface-400 text-xs">(Year {reading.alternateYear})</span>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{:else}
				<p class="text-surface-500 py-4 text-center">No readings found for this date and tradition.</p>
			{/if}
		</div>

		<!-- Alternative tradition readings -->
		{#if hasReadings(data.altGroups)}
			<div>
				<h3 class="text-surface-500 mb-3 text-lg font-semibold">
					{data.altTradition === 'cw' ? 'Common Worship' : 'Book of Common Prayer'}
				</h3>
				<div class="space-y-6 opacity-75">
					{#each sortedContexts(data.altGroups) as ctx}
						{@const readings = data.altGroups[ctx]}
						{#if readings && readings.length > 0}
							<div>
								<h4 class="text-surface-600 mb-2 text-sm font-semibold uppercase tracking-wide">
									{contextLabel(ctx)}
								</h4>
								<div class="space-y-2">
									{#each readings as reading}
										<div class="border-surface-300 flex items-baseline gap-3 rounded border p-3">
											<span class="text-surface-500 w-28 shrink-0 text-sm">
												{ReadingTypeLabels[reading.readingType as keyof typeof ReadingTypeLabels] ?? reading.readingType}
											</span>
											<span class="font-medium">{reading.reference}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<div class="text-surface-500 py-8 text-center">
			<p>No lectionary occasion found for this date.</p>
			<p class="mt-2 text-sm">Try selecting a different date.</p>
		</div>
	{/if}
</div>
