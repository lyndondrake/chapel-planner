<script lang="ts">
	import { formatDate } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Service Blocks — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Service Blocks</h1>
		<a href="/blocks/new" class="preset-filled-primary-500 rounded px-4 py-2">New Block</a>
	</div>

	{#if data.blocks.length === 0}
		<p class="text-surface-400 py-12 text-center">No service blocks found.</p>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.blocks as block}
				<a href="/blocks/{block.id}" class="preset-outlined-surface-50 block rounded-lg p-6 transition-shadow hover:shadow-lg">
					<h3 class="text-lg font-semibold">{block.name}</h3>
					{#if block.termName}
						<p class="text-surface-400 text-sm">{block.termName}</p>
					{/if}
					{#if block.seriesTitle}
						<p class="text-primary-400 mt-1 text-sm">Series: {block.seriesTitle}</p>
					{/if}
					{#if block.startDate && block.endDate}
						<p class="text-surface-500 mt-2 text-xs">{formatDate(block.startDate)} – {formatDate(block.endDate)}</p>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
