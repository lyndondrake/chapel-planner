<script lang="ts">
	import { ServiceTypeLabels } from '$lib/types/enums';
	import { formatDate, formatTime } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Dashboard — Chapel Planner</title>
</svelte:head>

<div class="space-y-8">
	<h1 class="text-3xl font-bold">Dashboard</h1>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<a href="/services" class="preset-outlined-surface-50 rounded-lg p-6 transition-shadow hover:shadow-lg">
			<div class="text-3xl font-bold">{data.totalServices}</div>
			<div class="text-surface-500">Upcoming Services</div>
		</a>
		<a href="/blocks" class="preset-outlined-surface-50 rounded-lg p-6 transition-shadow hover:shadow-lg">
			<div class="text-3xl font-bold">{data.totalBlocks}</div>
			<div class="text-surface-500">Service Blocks</div>
		</a>
		<a href="/people" class="preset-outlined-surface-50 rounded-lg p-6 transition-shadow hover:shadow-lg">
			<div class="text-3xl font-bold">{data.totalPeople}</div>
			<div class="text-surface-500">People</div>
		</a>
	</div>

	<section>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold">Upcoming Services</h2>
			<a href="/services/new" class="preset-filled-primary-500 rounded px-4 py-2 text-sm">New Service</a>
		</div>

		{#if data.upcomingServices.length === 0}
			<p class="text-surface-500 py-8 text-center">No upcoming services.</p>
		{:else}
			<div class="overflow-x-auto rounded-lg border border-surface-300">
				<table class="w-full">
					<thead class="bg-surface-100">
						<tr>
							<th class="px-4 py-3 text-left text-sm font-medium">Date</th>
							<th class="px-4 py-3 text-left text-sm font-medium">Time</th>
							<th class="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Type</th>
							<th class="px-4 py-3 text-left text-sm font-medium">Title</th>
							<th class="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Rite</th>
						</tr>
					</thead>
					<tbody>
						{#each data.upcomingServices as service}
							<tr class="border-surface-300 hover:bg-surface-100 border-t">
								<td class="px-4 py-3 text-sm">{formatDate(service.date)}</td>
								<td class="px-4 py-3 text-sm">{formatTime(service.time)}</td>
								<td class="px-4 py-3 text-sm hidden sm:table-cell">{ServiceTypeLabels[service.serviceType as keyof typeof ServiceTypeLabels] ?? service.serviceType}</td>
								<td class="px-4 py-3 text-sm">
									<a href="/services/{service.id}" class="text-primary-600 hover:underline">
										{service.title || service.liturgicalDay || ServiceTypeLabels[service.serviceType as keyof typeof ServiceTypeLabels] || 'Service'}
									</a>
								</td>
								<td class="px-4 py-3 text-sm hidden md:table-cell">{service.rite}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
