<script lang="ts">
	let { form }: { form: any } = $props();
</script>

<svelte:head>
	<title>New Person — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/people" class="text-surface-400 hover:text-surface-200">&larr; Back</a>
		<h1 class="text-3xl font-bold">New Person</h1>
	</div>

	{#if form?.error}
		<div class="rounded bg-red-900 p-4 text-red-200">{form.error}</div>
	{/if}

	<form method="POST" class="max-w-2xl space-y-6">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<label for="title" class="mb-1 block text-sm font-medium">Title</label>
				<input type="text" id="title" name="title" class="input w-full rounded border border-surface-600 bg-surface-800 px-3 py-2" placeholder="e.g. The Revd" />
			</div>
			<div>
				<label for="firstName" class="mb-1 block text-sm font-medium">First Name *</label>
				<input type="text" id="firstName" name="firstName" required class="input w-full rounded border border-surface-600 bg-surface-800 px-3 py-2" />
			</div>
			<div>
				<label for="lastName" class="mb-1 block text-sm font-medium">Last Name *</label>
				<input type="text" id="lastName" name="lastName" required class="input w-full rounded border border-surface-600 bg-surface-800 px-3 py-2" />
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="preferredName" class="mb-1 block text-sm font-medium">Preferred Name</label>
				<input type="text" id="preferredName" name="preferredName" class="input w-full rounded border border-surface-600 bg-surface-800 px-3 py-2" />
			</div>
			<div>
				<label for="suffix" class="mb-1 block text-sm font-medium">Suffix</label>
				<input type="text" id="suffix" name="suffix" class="input w-full rounded border border-surface-600 bg-surface-800 px-3 py-2" placeholder="e.g. DD, OBE" />
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="email" class="mb-1 block text-sm font-medium">Email</label>
				<input type="email" id="email" name="email" class="input w-full rounded border border-surface-600 bg-surface-800 px-3 py-2" />
			</div>
			<div>
				<label for="phone" class="mb-1 block text-sm font-medium">Phone</label>
				<input type="text" id="phone" name="phone" class="input w-full rounded border border-surface-600 bg-surface-800 px-3 py-2" />
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="institution" class="mb-1 block text-sm font-medium">Institution</label>
				<input type="text" id="institution" name="institution" class="input w-full rounded border border-surface-600 bg-surface-800 px-3 py-2" />
			</div>
			<div class="flex items-end pb-2">
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" name="isCollegeMember" class="h-4 w-4" />
					College Member
				</label>
			</div>
		</div>

		<div>
			<label for="dietaryNeeds" class="mb-1 block text-sm font-medium">Dietary Needs</label>
			<input type="text" id="dietaryNeeds" name="dietaryNeeds" class="input w-full rounded border border-surface-600 bg-surface-800 px-3 py-2" />
		</div>

		<div>
			<label for="notes" class="mb-1 block text-sm font-medium">Notes</label>
			<textarea id="notes" name="notes" rows="3" class="input w-full rounded border border-surface-600 bg-surface-800 px-3 py-2"></textarea>
		</div>

		<div class="flex gap-3">
			<button type="submit" class="preset-filled-primary-500 rounded px-6 py-2">Create Person</button>
			<a href="/people" class="preset-outlined-surface-50 rounded px-6 py-2">Cancel</a>
		</div>
	</form>
</div>
