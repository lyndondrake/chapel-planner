<script lang="ts">
	import { ServiceTypeLabels } from '$lib/types/enums';
	import { formatDate, formatTime } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();
</script>

<svelte:head>
	<title>{data.block.name} — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/blocks" class="text-surface-500 hover:text-surface-700">&larr; Back</a>
		<h1 class="text-3xl font-bold">{data.block.name}</h1>
	</div>

	{#if form?.success}
		<div class="rounded bg-green-100 p-4 text-green-200">Block updated.</div>
	{/if}
	{#if form?.error}
		<div class="rounded bg-red-100 p-4 text-red-800">{form.error}</div>
	{/if}

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<div>
			<h2 class="mb-4 text-xl font-semibold">Details</h2>
			<form method="POST" action="?/update" class="space-y-4">
				<div>
					<label for="name" class="mb-1 block text-sm font-medium">Name *</label>
					<input type="text" id="name" name="name" required value={data.block.name} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
				</div>
				<div>
					<label for="description" class="mb-1 block text-sm font-medium">Description</label>
					<textarea id="description" name="description" rows="3" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">{data.block.description ?? ''}</textarea>
				</div>
				<div>
					<label for="termName" class="mb-1 block text-sm font-medium">Term</label>
					<input type="text" id="termName" name="termName" value={data.block.termName ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
				</div>
				<div>
					<label for="seriesTitle" class="mb-1 block text-sm font-medium">Series Title</label>
					<input type="text" id="seriesTitle" name="seriesTitle" value={data.block.seriesTitle ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
				</div>
				<div>
					<label for="seriesDescription" class="mb-1 block text-sm font-medium">Series Description</label>
					<textarea id="seriesDescription" name="seriesDescription" rows="3" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">{data.block.seriesDescription ?? ''}</textarea>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="startDate" class="mb-1 block text-sm font-medium">Start Date</label>
						<input type="date" id="startDate" name="startDate" value={data.block.startDate ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
					</div>
					<div>
						<label for="endDate" class="mb-1 block text-sm font-medium">End Date</label>
						<input type="date" id="endDate" name="endDate" value={data.block.endDate ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
					</div>
				</div>
				<div class="flex gap-3">
					<button type="submit" class="preset-filled-primary-500 rounded px-6 py-2">Save Changes</button>
				</div>
			</form>
			<form method="POST" action="?/delete" class="mt-4">
				<button type="submit" class="rounded bg-red-100 px-6 py-2 text-red-800 hover:bg-red-800" onclick={(e) => { if (!confirm('Delete this block?')) e.preventDefault(); }}>Delete Block</button>
			</form>
		</div>

		<div>
			<h2 class="mb-4 text-xl font-semibold">Services ({data.block.services.length})</h2>
			{#if data.block.services.length === 0}
				<p class="text-surface-500 py-8 text-center">No services in this block.</p>
			{:else}
				<div class="space-y-2">
					{#each data.block.services as service}
						<a href="/services/{service.id}" class="border-surface-300 hover:bg-surface-100 flex items-center justify-between rounded border p-3 transition-colors">
							<div>
								<div class="font-medium">
									{service.title || service.liturgicalDay || ServiceTypeLabels[service.serviceType as keyof typeof ServiceTypeLabels] || 'Service'}
								</div>
								<div class="text-surface-500 text-sm">{formatDate(service.date)} {formatTime(service.time)}</div>
							</div>
							<span class="text-surface-500 text-sm">{service.rite}</span>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
