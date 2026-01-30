<script lang="ts">
	let { form }: { form: any } = $props();
</script>

<svelte:head>
	<title>New Block — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/blocks" class="text-surface-500 hover:text-surface-700">&larr; Back</a>
		<h1 class="text-3xl font-bold">New Service Block</h1>
	</div>

	{#if form?.error}
		<div class="rounded bg-red-100 p-4 text-red-800">{form.error}</div>
	{/if}

	<form method="POST" class="max-w-2xl space-y-6">
		<div>
			<label for="name" class="mb-1 block text-sm font-medium">Name *</label>
			<input type="text" id="name" name="name" required class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" placeholder="e.g. Michaelmas 2025 Evensongs" />
		</div>
		<div>
			<label for="description" class="mb-1 block text-sm font-medium">Description</label>
			<textarea id="description" name="description" rows="3" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2"></textarea>
		</div>
		<div>
			<label for="termName" class="mb-1 block text-sm font-medium">Term</label>
			<input type="text" id="termName" name="termName" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" placeholder="e.g. Michaelmas 2025" />
		</div>
		<div>
			<label for="seriesTitle" class="mb-1 block text-sm font-medium">Series Title</label>
			<input type="text" id="seriesTitle" name="seriesTitle" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
		</div>
		<div>
			<label for="seriesDescription" class="mb-1 block text-sm font-medium">Series Description</label>
			<textarea id="seriesDescription" name="seriesDescription" rows="3" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2"></textarea>
		</div>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="startDate" class="mb-1 block text-sm font-medium">Start Date</label>
				<input type="date" id="startDate" name="startDate" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
			<div>
				<label for="endDate" class="mb-1 block text-sm font-medium">End Date</label>
				<input type="date" id="endDate" name="endDate" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
		</div>
		<div class="flex gap-3">
			<button type="submit" class="preset-filled-primary-500 rounded px-6 py-2">Create Block</button>
			<a href="/blocks" class="preset-outlined-surface-50 rounded px-6 py-2">Cancel</a>
		</div>
	</form>
</div>
