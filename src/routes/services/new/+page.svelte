<script lang="ts">
	import { ServiceTypeLabels } from '$lib/types/enums';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();
</script>

<svelte:head>
	<title>New Service — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/services" class="text-surface-500 hover:text-surface-700">&larr; Back</a>
		<h1 class="text-3xl font-bold">New Service</h1>
	</div>

	{#if form?.error}
		<div class="rounded bg-red-100 p-4 text-red-800">{form.error}</div>
	{/if}

	<form method="POST" class="max-w-2xl space-y-6">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="serviceType" class="mb-1 block text-sm font-medium">Service Type *</label>
				<select id="serviceType" name="serviceType" required class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
					{#each Object.entries(ServiceTypeLabels) as [value, label]}
						<option {value}>{label}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="date" class="mb-1 block text-sm font-medium">Date *</label>
				<input type="date" id="date" name="date" required class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
			<div>
				<label for="time" class="mb-1 block text-sm font-medium">Start Time</label>
				<input type="time" id="time" name="time" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
			<div>
				<label for="endTime" class="mb-1 block text-sm font-medium">End Time</label>
				<input type="time" id="endTime" name="endTime" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
		</div>

		<div>
			<label for="title" class="mb-1 block text-sm font-medium">Title</label>
			<input type="text" id="title" name="title" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" placeholder="Optional display title" />
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<label for="rite" class="mb-1 block text-sm font-medium">Rite</label>
				<select id="rite" name="rite" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
					<option value="CW">Common Worship</option>
					<option value="BCP">Book of Common Prayer</option>
				</select>
			</div>
			<div>
				<label for="visibility" class="mb-1 block text-sm font-medium">Visibility</label>
				<select id="visibility" name="visibility" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
					<option value="college">College</option>
					<option value="private">Private</option>
				</select>
			</div>
			<div>
				<label for="location" class="mb-1 block text-sm font-medium">Location</label>
				<input type="text" id="location" name="location" value="Chapel" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<label for="liturgicalDay" class="mb-1 block text-sm font-medium">Liturgical Day</label>
				<input type="text" id="liturgicalDay" name="liturgicalDay" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" placeholder="e.g. Third Sunday of Advent" />
			</div>
			<div>
				<label for="liturgicalSeason" class="mb-1 block text-sm font-medium">Season</label>
				<select id="liturgicalSeason" name="liturgicalSeason" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
					<option value="">—</option>
					<option value="advent">Advent</option>
					<option value="christmas">Christmas</option>
					<option value="epiphany">Epiphany</option>
					<option value="lent">Lent</option>
					<option value="holy_week">Holy Week</option>
					<option value="easter">Easter</option>
					<option value="ascension">Ascension</option>
					<option value="pentecost">Pentecost</option>
					<option value="trinity">Trinity</option>
					<option value="ordinary_time">Ordinary Time</option>
					<option value="kingdom">Kingdom</option>
				</select>
			</div>
			<div>
				<label for="liturgicalColour" class="mb-1 block text-sm font-medium">Colour</label>
				<select id="liturgicalColour" name="liturgicalColour" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
					<option value="">—</option>
					<option value="white">White</option>
					<option value="gold">Gold</option>
					<option value="red">Red</option>
					<option value="green">Green</option>
					<option value="purple">Purple</option>
					<option value="blue">Blue</option>
					<option value="rose">Rose</option>
					<option value="black">Black</option>
					<option value="unbleached_linen">Unbleached Linen</option>
				</select>
			</div>
		</div>

		<div>
			<label for="blockId" class="mb-1 block text-sm font-medium">Service Block</label>
			<select id="blockId" name="blockId" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
				<option value="">None</option>
				{#each data.blocks as block}
					<option value={block.id}>{block.name}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="notes" class="mb-1 block text-sm font-medium">Notes</label>
			<textarea id="notes" name="notes" rows="3" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2"></textarea>
		</div>

		<div class="flex gap-3">
			<button type="submit" class="preset-filled-primary-500 rounded px-6 py-2">Create Service</button>
			<a href="/services" class="preset-outlined-surface-50 rounded px-6 py-2">Cancel</a>
		</div>
	</form>
</div>
