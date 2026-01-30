<script lang="ts">
	import { ServiceTypeLabels } from '$lib/types/enums';
	import { formatDate, formatTime } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let filtersOpen = $state(false);
</script>

<svelte:head>
	<title>Services — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Services</h1>
		<div class="flex gap-2">
			<button
				class="preset-outlined-surface-50 rounded px-3 py-2 text-sm"
				onclick={() => filtersOpen = !filtersOpen}
				aria-expanded={filtersOpen}
			>
				{filtersOpen ? 'Hide Filters' : 'Filters'}
			</button>
			<a href="/services/new" class="preset-filled-primary-500 rounded px-4 py-2">New Service</a>
		</div>
	</div>

	{#if filtersOpen}
		<form method="GET" class="grid grid-cols-1 gap-3 rounded-lg border border-surface-700 bg-surface-800 p-4 sm:grid-cols-2 lg:grid-cols-4">
			<div>
				<label for="filter-from" class="mb-1 block text-xs text-surface-400">From</label>
				<input
					id="filter-from"
					type="date"
					name="from"
					value={data.filters.from}
					class="w-full rounded border border-surface-600 bg-surface-900 px-3 py-2 text-sm"
				/>
			</div>
			<div>
				<label for="filter-to" class="mb-1 block text-xs text-surface-400">To</label>
				<input
					id="filter-to"
					type="date"
					name="to"
					value={data.filters.to}
					class="w-full rounded border border-surface-600 bg-surface-900 px-3 py-2 text-sm"
				/>
			</div>
			<div>
				<label for="filter-type" class="mb-1 block text-xs text-surface-400">Service Type</label>
				<select
					id="filter-type"
					name="serviceType"
					class="w-full rounded border border-surface-600 bg-surface-900 px-3 py-2 text-sm"
				>
					<option value="">All types</option>
					{#each Object.entries(ServiceTypeLabels) as [value, label]}
						<option {value} selected={data.filters.serviceType === value}>{label}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="filter-block" class="mb-1 block text-xs text-surface-400">Block</label>
				<select
					id="filter-block"
					name="blockId"
					class="w-full rounded border border-surface-600 bg-surface-900 px-3 py-2 text-sm"
				>
					<option value="">All blocks</option>
					{#each data.blocks as block}
						<option value={block.id} selected={data.filters.blockId === String(block.id)}>{block.name}</option>
					{/each}
				</select>
			</div>
			<div class="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
				<button type="submit" class="preset-filled-primary-500 rounded px-4 py-2 text-sm">Apply</button>
				<a href="/services" class="preset-outlined-surface-50 rounded px-4 py-2 text-sm">Clear</a>
			</div>
		</form>
	{/if}

	{#if data.services.length === 0}
		<p class="text-surface-400 py-12 text-center">No services found.</p>
	{:else}
		<div class="text-surface-400 text-sm">{data.services.length} service{data.services.length !== 1 ? 's' : ''}</div>
		<div class="overflow-x-auto rounded-lg border border-surface-700">
			<table class="w-full">
				<thead class="bg-surface-800">
					<tr>
						<th class="px-4 py-3 text-left text-sm font-medium">Date</th>
						<th class="px-4 py-3 text-left text-sm font-medium">Time</th>
						<th class="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Type</th>
						<th class="px-4 py-3 text-left text-sm font-medium">Title</th>
						<th class="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Rite</th>
						<th class="px-4 py-3 text-left text-sm font-medium">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.services as service}
						<tr class="border-surface-700 hover:bg-surface-800 border-t">
							<td class="px-4 py-3 text-sm">{formatDate(service.date)}</td>
							<td class="px-4 py-3 text-sm">{formatTime(service.time)}</td>
							<td class="px-4 py-3 text-sm hidden sm:table-cell">{ServiceTypeLabels[service.serviceType as keyof typeof ServiceTypeLabels] ?? service.serviceType}</td>
							<td class="px-4 py-3 text-sm">
								<a href="/services/{service.id}" class="text-primary-400 hover:underline">
									{service.title || service.liturgicalDay || ServiceTypeLabels[service.serviceType as keyof typeof ServiceTypeLabels] || 'Service'}
								</a>
							</td>
							<td class="px-4 py-3 text-sm hidden md:table-cell">{service.rite}</td>
							<td class="px-4 py-3 text-sm">
								{#if service.isConfirmed}
									<span class="rounded bg-green-900 px-2 py-0.5 text-xs text-green-300">Confirmed</span>
								{:else}
									<span class="rounded bg-yellow-900 px-2 py-0.5 text-xs text-yellow-300">Draft</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
