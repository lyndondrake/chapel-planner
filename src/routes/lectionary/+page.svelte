<script lang="ts">
	import {
		ReadingTypeLabels,
		OfficeReadingTypeLabels,
		ApocryphalBooks,
		LessonBooks,
		ServiceContextLabels
	} from '$lib/types/enums';
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
		'daily_eucharist',
		'morning_prayer',
		'evening_prayer',
		'second_service',
		'third_service'
	];

	const officeContexts = new Set(['morning_prayer', 'evening_prayer']);

	function allContexts(
		cwGroups: Record<string, unknown[]>,
		bcpGroups: Record<string, unknown[]>
	): string[] {
		const keys = new Set([...Object.keys(cwGroups), ...Object.keys(bcpGroups)]);
		return [...keys].sort((a, b) => {
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

	function readingLabel(
		readingType: string,
		ctx: string,
		book: string | null
	): string {
		if (officeContexts.has(ctx)) {
			return OfficeReadingTypeLabels[readingType] ?? readingType;
		}
		// For principal/eucharist contexts, detect Acts/Revelation in epistle slot
		if (readingType === 'epistle' && book && LessonBooks.has(book)) {
			return 'Lesson';
		}
		// Detect Apocrypha
		if (readingType === 'old_testament' && book && ApocryphalBooks.has(book)) {
			return 'Apocrypha';
		}
		return ReadingTypeLabels[readingType as keyof typeof ReadingTypeLabels] ?? readingType;
	}

	function groupLabel(
		group: { readingType: string; readings: { book?: string | null }[] },
		ctx: string
	): string {
		// Use the primary (first) reading's book for Apocrypha detection
		const primaryBook = group.readings[0]?.book ?? null;
		return readingLabel(group.readingType, ctx, primaryBook);
	}
</script>

<svelte:head>
	<title>Lectionary — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-3xl font-bold">Lectionary</h1>

	<!-- Date picker -->
	<form method="GET" class="flex flex-wrap items-end gap-4">
		<div>
			<label for="date" class="mb-1 block text-sm font-medium">Date</label>
			<input type="date" id="date" name="date" value={data.date} class="input rounded border border-surface-300 bg-surface-100 px-3 py-2" />
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
			{#if data.commemorations && data.commemorations.length > 0}
				<div class="text-surface-500 mt-2 text-sm">
					Also: {data.commemorations.map((c) => c.name).join('; ')}
				</div>
			{/if}
		</div>

		<!-- Collects & Prayers -->
		{#if data.occasion.collectCw || data.occasion.collectBcp || data.occasion.postCommunionCw || (data.commemorations && data.commemorations.some((c) => c.collectCw || c.postCommunionCw))}
			<div class="border-surface-300 rounded border p-6">
				<h3 class="mb-4 text-lg font-semibold">Collects & Prayers</h3>
				<div class="space-y-4">
					{#if data.occasion.collectCw}
						<div>
							<h4 class="text-surface-600 mb-1 text-sm font-semibold uppercase tracking-wide">CW Collect</h4>
							<p class="whitespace-pre-line">{data.occasion.collectCw}</p>
						</div>
					{/if}
					{#if data.occasion.collectBcp}
						<div>
							<h4 class="text-surface-600 mb-1 text-sm font-semibold uppercase tracking-wide">BCP Collect</h4>
							<p class="whitespace-pre-line">{data.occasion.collectBcp}</p>
						</div>
					{/if}
					{#if data.occasion.postCommunionCw}
						<div>
							<h4 class="text-surface-600 mb-1 text-sm font-semibold uppercase tracking-wide">Post Communion</h4>
							<p class="whitespace-pre-line">{data.occasion.postCommunionCw}</p>
						</div>
					{/if}
					{#if data.commemorations}
						{#each data.commemorations as comm}
							{#if comm.collectCw}
								<div>
									<h4 class="text-surface-600 mb-1 text-sm font-semibold uppercase tracking-wide">Collect — {comm.name}</h4>
									<p class="whitespace-pre-line">{comm.collectCw}</p>
								</div>
							{/if}
							{#if comm.postCommunionCw}
								<div>
									<h4 class="text-surface-600 mb-1 text-sm font-semibold uppercase tracking-wide">Post Communion — {comm.name}</h4>
									<p class="whitespace-pre-line">{comm.postCommunionCw}</p>
								</div>
							{/if}
						{/each}
					{/if}
				</div>
			</div>
		{/if}

		<!-- Readings grouped by service context, showing both traditions -->
		{#if hasReadings(data.cwGroups) || hasReadings(data.bcpGroups)}
			<div class="space-y-6">
				{#each allContexts(data.cwGroups, data.bcpGroups) as ctx}
					{@const cwReadingGroups = data.cwGroups[ctx] ?? []}
					{@const bcpReadingGroups = data.bcpGroups[ctx] ?? []}
					{#if cwReadingGroups.length > 0 || bcpReadingGroups.length > 0}
						<div>
							<h4 class="text-surface-600 mb-2 text-sm font-semibold uppercase tracking-wide">
								{contextLabel(ctx)}
							</h4>

							{#if cwReadingGroups.length > 0}
								<div class="mb-2">
									<span class="text-surface-400 mb-1 block text-xs font-medium uppercase">Common Worship</span>
									<div class="space-y-2">
										{#each cwReadingGroups as group}
											<div class="border-surface-300 flex items-baseline gap-3 rounded border p-3">
												<span class="text-surface-500 w-28 shrink-0 text-sm">
													{groupLabel(group, ctx)}
												</span>
												<span class="font-medium">
													{#each group.readings as reading, i}
														{#if i > 0}
															{' '}<em>or</em>{' '}
														{/if}
														{reading.reference}
													{/each}
												</span>
												{#if group.readings[0]?.alternateYear}
													<span class="text-surface-400 text-xs">(Year {group.readings[0].alternateYear})</span>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if bcpReadingGroups.length > 0}
								<div class="mb-2">
									<span class="text-surface-400 mb-1 block text-xs font-medium uppercase">Book of Common Prayer</span>
									<div class="space-y-2">
										{#each bcpReadingGroups as group}
											<div class="border-surface-300 flex items-baseline gap-3 rounded border p-3">
												<span class="text-surface-500 w-28 shrink-0 text-sm">
													{groupLabel(group, ctx)}
												</span>
												<span class="font-medium">
													{#each group.readings as reading, i}
														{#if i > 0}
															{' '}<em>or</em>{' '}
														{/if}
														{reading.reference}
													{/each}
												</span>
												{#if group.readings[0]?.alternateYear}
													<span class="text-surface-400 text-xs">(Year {group.readings[0].alternateYear})</span>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		{:else}
			<p class="text-surface-500 py-4 text-center">No readings found for this date.</p>
		{/if}

		<!-- Alternative occasion sections (non-principal occasions with their own readings) -->
		{#if data.alternativeOccasions && data.alternativeOccasions.length > 0}
			{#each data.alternativeOccasions as altOcc}
				<div class="border-surface-300 rounded border p-6">
					<div class="mb-4 flex flex-wrap items-center gap-3">
						<h3 class="text-xl font-bold">{altOcc.name}</h3>
						{#if altOcc.colour && colourDisplay[altOcc.colour]}
							<span class="rounded px-2 py-0.5 text-xs font-medium {colourDisplay[altOcc.colour].class}">
								{colourDisplay[altOcc.colour].label}
							</span>
						{/if}
						{#if altOcc.mappingType === 'transferred'}
							<span class="text-surface-500 text-xs italic">(may be celebrated today)</span>
						{/if}
					</div>

					<!-- Collects for alternative occasion -->
					{#if altOcc.collectCw || altOcc.collectBcp || altOcc.postCommunionCw}
						<div class="mb-4 space-y-3">
							{#if altOcc.collectCw}
								<div>
									<h4 class="text-surface-600 mb-1 text-sm font-semibold uppercase tracking-wide">CW Collect</h4>
									<p class="whitespace-pre-line">{altOcc.collectCw}</p>
								</div>
							{/if}
							{#if altOcc.collectBcp}
								<div>
									<h4 class="text-surface-600 mb-1 text-sm font-semibold uppercase tracking-wide">BCP Collect</h4>
									<p class="whitespace-pre-line">{altOcc.collectBcp}</p>
								</div>
							{/if}
							{#if altOcc.postCommunionCw}
								<div>
									<h4 class="text-surface-600 mb-1 text-sm font-semibold uppercase tracking-wide">Post Communion</h4>
									<p class="whitespace-pre-line">{altOcc.postCommunionCw}</p>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Readings for alternative occasion -->
					{#each allContexts(altOcc.cwGroups, altOcc.bcpGroups) as ctx}
						{@const cwReadingGroups = altOcc.cwGroups[ctx] ?? []}
						{@const bcpReadingGroups = altOcc.bcpGroups[ctx] ?? []}
						{#if cwReadingGroups.length > 0 || bcpReadingGroups.length > 0}
							<div class="mb-4">
								<h4 class="text-surface-600 mb-2 text-sm font-semibold uppercase tracking-wide">
									{contextLabel(ctx)}
								</h4>

								{#if cwReadingGroups.length > 0}
									<div class="mb-2">
										<span class="text-surface-400 mb-1 block text-xs font-medium uppercase">Common Worship</span>
										<div class="space-y-2">
											{#each cwReadingGroups as group}
												<div class="border-surface-300 flex items-baseline gap-3 rounded border p-3">
													<span class="text-surface-500 w-28 shrink-0 text-sm">
														{groupLabel(group, ctx)}
													</span>
													<span class="font-medium">
														{#each group.readings as reading, i}
															{#if i > 0}
																{' '}<em>or</em>{' '}
															{/if}
															{reading.reference}
														{/each}
													</span>
													{#if group.readings[0]?.alternateYear}
														<span class="text-surface-400 text-xs">(Year {group.readings[0].alternateYear})</span>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}

								{#if bcpReadingGroups.length > 0}
									<div class="mb-2">
										<span class="text-surface-400 mb-1 block text-xs font-medium uppercase">Book of Common Prayer</span>
										<div class="space-y-2">
											{#each bcpReadingGroups as group}
												<div class="border-surface-300 flex items-baseline gap-3 rounded border p-3">
													<span class="text-surface-500 w-28 shrink-0 text-sm">
														{groupLabel(group, ctx)}
													</span>
													<span class="font-medium">
														{#each group.readings as reading, i}
															{#if i > 0}
																{' '}<em>or</em>{' '}
															{/if}
															{reading.reference}
														{/each}
													</span>
													{#if group.readings[0]?.alternateYear}
														<span class="text-surface-400 text-xs">(Year {group.readings[0].alternateYear})</span>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		{/if}
	{:else}
		<div class="text-surface-500 py-8 text-center">
			<p>No lectionary occasion found for this date.</p>
			<p class="mt-2 text-sm">Try selecting a different date.</p>
		</div>
	{/if}
</div>
