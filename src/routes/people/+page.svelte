<script lang="ts">
	import { formatPersonName } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>People — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">People</h1>
		<a href="/people/new" class="preset-filled-primary-500 rounded px-4 py-2">New Person</a>
	</div>

	<form method="GET" class="flex flex-col gap-3 sm:flex-row">
		<input
			type="text"
			name="search"
			value={data.search}
			placeholder="Search…"
			class="input flex-1 rounded border border-surface-300 bg-surface-100 px-3 py-2"
			aria-label="Search people"
		/>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" name="collegeMembersOnly" value="true" checked={data.collegeMembersOnly} />
			College members only
		</label>
		<button type="submit" class="preset-outlined-surface-50 rounded px-4 py-2">Search</button>
	</form>

	{#if data.people.length === 0}
		<p class="text-surface-500 py-12 text-center">No people found.</p>
	{:else}
		<div class="text-surface-500 text-sm">{data.people.length} {data.people.length === 1 ? 'person' : 'people'}</div>
		<div class="overflow-x-auto rounded-lg border border-surface-300">
			<table class="w-full">
				<thead class="bg-surface-100">
					<tr>
						<th class="px-4 py-3 text-left text-sm font-medium">Name</th>
						<th class="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Email</th>
						<th class="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Institution</th>
						<th class="px-4 py-3 text-left text-sm font-medium">College</th>
					</tr>
				</thead>
				<tbody>
					{#each data.people as person}
						<tr class="border-surface-300 hover:bg-surface-100 border-t">
							<td class="px-4 py-3 text-sm">
								<a href="/people/{person.id}" class="text-primary-600 hover:underline">
									{formatPersonName(person)}
								</a>
							</td>
							<td class="px-4 py-3 text-sm hidden sm:table-cell">{person.email ?? '—'}</td>
							<td class="px-4 py-3 text-sm hidden md:table-cell">{person.institution ?? '—'}</td>
							<td class="px-4 py-3 text-sm">{person.isCollegeMember ? 'Yes' : '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
