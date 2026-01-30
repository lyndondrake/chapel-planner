<script lang="ts">
	import { ReadingTypeLabels } from '$lib/types/enums';
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
			<input type="date" id="date" name="date" value={data.date} class="input rounded border border-surface-600 bg-surface-800 px-3 py-2" />
		</div>
		<div>
			<label for="tradition" class="mb-1 block text-sm font-medium">Tradition</label>
			<select id="tradition" name="tradition" class="input rounded border border-surface-600 bg-surface-800 px-3 py-2">
				<option value="cw" selected={data.tradition === 'cw'}>Common Worship</option>
				<option value="bcp" selected={data.tradition === 'bcp'}>Book of Common Prayer</option>
			</select>
		</div>
		<button type="submit" class="preset-filled-primary-500 rounded px-4 py-2">Look Up</button>
	</form>

	<!-- Occasion info -->
	{#if data.occasion}
		<div class="border-surface-700 rounded border p-6">
			<div class="mb-4 flex flex-wrap items-center gap-3">
				<h2 class="text-2xl font-bold">{data.occasion.name}</h2>
				{#if data.occasion.colour && colourDisplay[data.occasion.colour]}
					<span class="rounded px-2 py-0.5 text-xs font-medium {colourDisplay[data.occasion.colour].class}">
						{colourDisplay[data.occasion.colour].label}
					</span>
				{/if}
			</div>
			<div class="text-surface-400 flex flex-wrap gap-4 text-sm">
				{#if data.occasion.season}
					<span>Season: {seasonLabels[data.occasion.season] ?? data.occasion.season}</span>
				{/if}
				{#if data.occasion.liturgicalYear}
					<span>{yearLabels[data.occasion.liturgicalYear] ?? `Year ${data.occasion.liturgicalYear}`}</span>
				{/if}
			</div>
		</div>

		<!-- Primary tradition readings -->
		<div>
			<h3 class="mb-3 text-lg font-semibold">
				{data.tradition === 'cw' ? 'Common Worship' : 'Book of Common Prayer'} — Principal Service
			</h3>
			{#if data.readings.length === 0}
				<p class="text-surface-400 py-4 text-center">No readings found for this date and tradition.</p>
			{:else}
				<div class="space-y-2">
					{#each data.readings as reading}
						<div class="border-surface-700 flex items-baseline gap-3 rounded border p-3">
							<span class="text-surface-400 w-28 shrink-0 text-sm">
								{ReadingTypeLabels[reading.readingType as keyof typeof ReadingTypeLabels] ?? reading.readingType}
							</span>
							<span class="font-medium">{reading.reference}</span>
							{#if reading.alternateYear}
								<span class="text-surface-500 text-xs">(Year {reading.alternateYear})</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Alternative tradition readings -->
		{#if data.altReadings.length > 0}
			<div>
				<h3 class="mb-3 text-lg font-semibold text-surface-400">
					{data.altTradition === 'cw' ? 'Common Worship' : 'Book of Common Prayer'} — Principal Service
				</h3>
				<div class="space-y-2 opacity-75">
					{#each data.altReadings as reading}
						<div class="border-surface-700 flex items-baseline gap-3 rounded border p-3">
							<span class="text-surface-400 w-28 shrink-0 text-sm">
								{ReadingTypeLabels[reading.readingType as keyof typeof ReadingTypeLabels] ?? reading.readingType}
							</span>
							<span class="font-medium">{reading.reference}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<div class="text-surface-400 py-8 text-center">
			<p>No lectionary occasion found for this date.</p>
			<p class="mt-2 text-sm">Try selecting a Sunday or major feast day.</p>
		</div>
	{/if}
</div>
