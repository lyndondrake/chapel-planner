<script lang="ts">
	import { formatPersonName } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();
</script>

<svelte:head>
	<title>{formatPersonName(data.person)} — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/people" class="text-surface-500 hover:text-surface-700">&larr; Back</a>
		<h1 class="text-3xl font-bold">{formatPersonName(data.person)}</h1>
	</div>

	{#if form?.success}
		<div class="rounded bg-green-100 p-4 text-green-200">Person updated.</div>
	{/if}
	{#if form?.error}
		<div class="rounded bg-red-100 p-4 text-red-800">{form.error}</div>
	{/if}

	<form method="POST" action="?/update" class="max-w-2xl space-y-6">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<label for="title" class="mb-1 block text-sm font-medium">Title</label>
				<input type="text" id="title" name="title" value={data.person.title ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
			<div>
				<label for="firstName" class="mb-1 block text-sm font-medium">First Name *</label>
				<input type="text" id="firstName" name="firstName" required value={data.person.firstName} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
			<div>
				<label for="lastName" class="mb-1 block text-sm font-medium">Last Name *</label>
				<input type="text" id="lastName" name="lastName" required value={data.person.lastName} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="preferredName" class="mb-1 block text-sm font-medium">Preferred Name</label>
				<input type="text" id="preferredName" name="preferredName" value={data.person.preferredName ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
			<div>
				<label for="suffix" class="mb-1 block text-sm font-medium">Suffix</label>
				<input type="text" id="suffix" name="suffix" value={data.person.suffix ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="email" class="mb-1 block text-sm font-medium">Email</label>
				<input type="email" id="email" name="email" value={data.person.email ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
			<div>
				<label for="phone" class="mb-1 block text-sm font-medium">Phone</label>
				<input type="text" id="phone" name="phone" value={data.person.phone ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="institution" class="mb-1 block text-sm font-medium">Institution</label>
				<input type="text" id="institution" name="institution" value={data.person.institution ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
			<div class="flex items-end pb-2">
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" name="isCollegeMember" checked={data.person.isCollegeMember ?? false} class="h-4 w-4" />
					College Member
				</label>
			</div>
		</div>

		<div>
			<label for="dietaryNeeds" class="mb-1 block text-sm font-medium">Dietary Needs</label>
			<input type="text" id="dietaryNeeds" name="dietaryNeeds" value={data.person.dietaryNeeds ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
		</div>

		<div>
			<label for="notes" class="mb-1 block text-sm font-medium">Notes</label>
			<textarea id="notes" name="notes" rows="3" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">{data.person.notes ?? ''}</textarea>
		</div>

		<div class="flex gap-3">
			<button type="submit" class="preset-filled-primary-500 rounded px-6 py-2">Save Changes</button>
		</div>
	</form>

	<form method="POST" action="?/delete" class="mt-4">
		<button type="submit" class="rounded bg-red-100 px-6 py-2 text-red-800 hover:bg-red-800" onclick={(e) => { if (!confirm('Delete this person?')) e.preventDefault(); }}>Delete Person</button>
	</form>
</div>
