<script lang="ts">
	import { ServiceTypeLabels, RoleLabels, InvitationStatusLabels, ReadingTypeLabels, BookingStatus } from '$lib/types/enums';
	import { formatDate, formatTime } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();

	let activeTab = $state('overview');
	$effect(() => {
		if (form?.tab) {
			activeTab = form.tab;
		}
	});
	let showAddRole = $state(false);
	let editingRoleId = $state<number | null>(null);
	let hospitalityRoleId = $state<number | null>(null);
	let showAddReading = $state(false);
	let editingReadingId = $state<number | null>(null);
	let showAddMusic = $state(false);
	let editingMusicId = $state<number | null>(null);

	const MusicTypeLabels: Record<string, string> = {
		hymn: 'Hymn',
		anthem: 'Anthem',
		psalm_setting: 'Psalm Setting',
		canticle: 'Canticle',
		mass_setting: 'Mass Setting',
		introit: 'Introit',
		voluntary: 'Voluntary',
		other: 'Other'
	};

	const MusicPositionLabels: Record<string, string> = {
		processional: 'Processional',
		gradual: 'Gradual',
		offertory: 'Offertory',
		communion: 'Communion',
		recessional: 'Recessional',
		anthem: 'Anthem',
		introit: 'Introit',
		pre_service: 'Pre-service',
		post_service: 'Post-service',
		other: 'Other'
	};

	function musicDisplayTitle(item: (typeof data.service.music)[0]) {
		if (item.hymnId && item.hymnTitle) {
			const parts = [];
			if (item.hymnalName && item.hymnNumber) parts.push(`${item.hymnalName} ${item.hymnNumber}`);
			parts.push(item.hymnTitle);
			if (item.tune) parts.push(`(${item.tune})`);
			return parts.join(' — ');
		}
		return item.title ?? 'Untitled';
	}

	const BookingStatusLabels: Record<string, string> = {
		not_needed: 'Not Needed',
		pending: 'Pending',
		requested: 'Requested',
		confirmed: 'Confirmed',
		cancelled: 'Cancelled'
	};

	function personDisplayName(role: (typeof data.service.roles)[0]) {
		if (!role.personId) return 'Unassigned';
		const parts = [];
		if (role.personTitle) parts.push(role.personTitle);
		parts.push(role.personFirstName ?? '');
		parts.push(role.personLastName ?? '');
		return parts.join(' ').trim() || 'Unknown';
	}

	function statusColour(status: string) {
		switch (status) {
			case 'accepted':
				return 'bg-green-100 text-green-800';
			case 'declined':
				return 'bg-red-100 text-red-300';
			case 'requested':
				return 'bg-blue-100 text-blue-300';
			default:
				return 'bg-surface-700 text-surface-700';
		}
	}

	const externalRoles = $derived(
		data.service.roles.filter((r) => r.personId && !r.personIsCollegeMember)
	);
</script>

<svelte:head>
	<title>{data.service.title || data.service.liturgicalDay || 'Service'} — Chapel Planner</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/services" class="text-surface-500 hover:text-surface-700">&larr; Back</a>
		<h1 class="text-3xl font-bold">
			{data.service.title || data.service.liturgicalDay || ServiceTypeLabels[data.service.serviceType as keyof typeof ServiceTypeLabels] || 'Service'}
		</h1>
		{#if data.service.isConfirmed}
			<span class="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Confirmed</span>
		{:else}
			<span class="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">Draft</span>
		{/if}
	</div>

	{#if form?.success}
		<div class="rounded bg-green-100 p-4 text-green-200">
			{form.tab === 'roles' ? 'Roles updated.' : form.tab === 'hospitality' ? 'Hospitality updated.' : 'Service updated.'}
		</div>
	{/if}
	{#if form?.error}
		<div class="rounded bg-red-100 p-4 text-red-800">{form.error}</div>
	{/if}

	<div class="border-surface-300 flex gap-1 border-b">
		<button class="px-4 py-2 text-sm {activeTab === 'overview' ? 'border-primary-500 text-primary-600 border-b-2' : 'text-surface-500 hover:text-surface-700'}" onclick={() => activeTab = 'overview'}>Overview</button>
		<button class="px-4 py-2 text-sm {activeTab === 'roles' ? 'border-primary-500 text-primary-600 border-b-2' : 'text-surface-500 hover:text-surface-700'}" onclick={() => activeTab = 'roles'}>Roles ({data.service.roles.length})</button>
		<button class="px-4 py-2 text-sm {activeTab === 'hospitality' ? 'border-primary-500 text-primary-600 border-b-2' : 'text-surface-500 hover:text-surface-700'}" onclick={() => activeTab = 'hospitality'}>Hospitality ({externalRoles.length})</button>
		<button class="px-4 py-2 text-sm {activeTab === 'readings' ? 'border-primary-500 text-primary-600 border-b-2' : 'text-surface-500 hover:text-surface-700'}" onclick={() => activeTab = 'readings'}>Readings ({data.service.readings.length})</button>
		<button class="px-4 py-2 text-sm {activeTab === 'music' ? 'border-primary-500 text-primary-600 border-b-2' : 'text-surface-500 hover:text-surface-700'}" onclick={() => activeTab = 'music'}>Music ({data.service.music.length})</button>
	</div>

	{#if activeTab === 'overview'}
		<form method="POST" action="?/update" class="max-w-2xl space-y-6">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label for="serviceType" class="mb-1 block text-sm font-medium">Service Type *</label>
					<select id="serviceType" name="serviceType" required class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
						{#each Object.entries(ServiceTypeLabels) as [value, label]}
							<option {value} selected={value === data.service.serviceType}>{label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="date" class="mb-1 block text-sm font-medium">Date *</label>
					<input type="date" id="date" name="date" required value={data.service.date} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
				</div>
				<div>
					<label for="time" class="mb-1 block text-sm font-medium">Start Time</label>
					<input type="time" id="time" name="time" value={data.service.time ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
				</div>
				<div>
					<label for="endTime" class="mb-1 block text-sm font-medium">End Time</label>
					<input type="time" id="endTime" name="endTime" value={data.service.endTime ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
				</div>
			</div>

			<div>
				<label for="title" class="mb-1 block text-sm font-medium">Title</label>
				<input type="text" id="title" name="title" value={data.service.title ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					<label for="rite" class="mb-1 block text-sm font-medium">Rite</label>
					<select id="rite" name="rite" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
						<option value="CW" selected={data.service.rite === 'CW'}>Common Worship</option>
						<option value="BCP" selected={data.service.rite === 'BCP'}>Book of Common Prayer</option>
					</select>
				</div>
				<div>
					<label for="visibility" class="mb-1 block text-sm font-medium">Visibility</label>
					<select id="visibility" name="visibility" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
						<option value="college" selected={data.service.visibility === 'college'}>College</option>
						<option value="private" selected={data.service.visibility === 'private'}>Private</option>
					</select>
				</div>
				<div>
					<label for="location" class="mb-1 block text-sm font-medium">Location</label>
					<input type="text" id="location" name="location" value={data.service.location ?? 'Chapel'} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					<label for="liturgicalDay" class="mb-1 block text-sm font-medium">Liturgical Day</label>
					<input type="text" id="liturgicalDay" name="liturgicalDay" value={data.service.liturgicalDay ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
				</div>
				<div>
					<label for="liturgicalSeason" class="mb-1 block text-sm font-medium">Season</label>
					<select id="liturgicalSeason" name="liturgicalSeason" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
						<option value="" selected={!data.service.liturgicalSeason}>—</option>
						<option value="advent" selected={data.service.liturgicalSeason === 'advent'}>Advent</option>
						<option value="christmas" selected={data.service.liturgicalSeason === 'christmas'}>Christmas</option>
						<option value="epiphany" selected={data.service.liturgicalSeason === 'epiphany'}>Epiphany</option>
						<option value="lent" selected={data.service.liturgicalSeason === 'lent'}>Lent</option>
						<option value="holy_week" selected={data.service.liturgicalSeason === 'holy_week'}>Holy Week</option>
						<option value="easter" selected={data.service.liturgicalSeason === 'easter'}>Easter</option>
						<option value="ascension" selected={data.service.liturgicalSeason === 'ascension'}>Ascension</option>
						<option value="pentecost" selected={data.service.liturgicalSeason === 'pentecost'}>Pentecost</option>
						<option value="trinity" selected={data.service.liturgicalSeason === 'trinity'}>Trinity</option>
						<option value="ordinary_time" selected={data.service.liturgicalSeason === 'ordinary_time'}>Ordinary Time</option>
						<option value="kingdom" selected={data.service.liturgicalSeason === 'kingdom'}>Kingdom</option>
					</select>
				</div>
				<div>
					<label for="liturgicalColour" class="mb-1 block text-sm font-medium">Colour</label>
					<select id="liturgicalColour" name="liturgicalColour" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
						<option value="" selected={!data.service.liturgicalColour}>—</option>
						<option value="white" selected={data.service.liturgicalColour === 'white'}>White</option>
						<option value="gold" selected={data.service.liturgicalColour === 'gold'}>Gold</option>
						<option value="red" selected={data.service.liturgicalColour === 'red'}>Red</option>
						<option value="green" selected={data.service.liturgicalColour === 'green'}>Green</option>
						<option value="purple" selected={data.service.liturgicalColour === 'purple'}>Purple</option>
						<option value="blue" selected={data.service.liturgicalColour === 'blue'}>Blue</option>
						<option value="rose" selected={data.service.liturgicalColour === 'rose'}>Rose</option>
						<option value="black" selected={data.service.liturgicalColour === 'black'}>Black</option>
						<option value="unbleached_linen" selected={data.service.liturgicalColour === 'unbleached_linen'}>Unbleached Linen</option>
					</select>
				</div>
			</div>

			<div>
				<label for="blockId" class="mb-1 block text-sm font-medium">Service Block</label>
				<select id="blockId" name="blockId" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
					<option value="" selected={!data.service.blockId}>None</option>
					{#each data.blocks as block}
						<option value={block.id} selected={block.id === data.service.blockId}>{block.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="notes" class="mb-1 block text-sm font-medium">Notes</label>
				<textarea id="notes" name="notes" rows="3" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">{data.service.notes ?? ''}</textarea>
			</div>

			<div>
				<label for="specialInstructions" class="mb-1 block text-sm font-medium">Special Instructions</label>
				<textarea id="specialInstructions" name="specialInstructions" rows="2" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">{data.service.specialInstructions ?? ''}</textarea>
			</div>

			<div class="flex items-center gap-2">
				<input type="checkbox" id="isConfirmed" name="isConfirmed" checked={data.service.isConfirmed ?? false} class="h-4 w-4" />
				<label for="isConfirmed" class="text-sm font-medium">Confirmed</label>
			</div>

			<div class="flex gap-3">
				<button type="submit" class="preset-filled-primary-500 rounded px-6 py-2">Save Changes</button>
			</div>
		</form>

		<form method="POST" action="?/delete" class="mt-4">
			<button type="submit" class="rounded bg-red-100 px-6 py-2 text-red-800 hover:bg-red-800" onclick={(e) => { if (!confirm('Delete this service?')) e.preventDefault(); }}>Delete Service</button>
		</form>

	{:else if activeTab === 'roles'}
		<div class="max-w-2xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Assigned Roles</h2>
				<button class="preset-filled-primary-500 rounded px-4 py-1.5 text-sm" onclick={() => showAddRole = !showAddRole}>
					{showAddRole ? 'Cancel' : 'Add Role'}
				</button>
			</div>

			{#if showAddRole}
				<form method="POST" action="?/addRole" class="border-surface-300 mb-6 space-y-4 rounded border p-4">
					<h3 class="font-medium">Add New Role</h3>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="newRole" class="mb-1 block text-sm font-medium">Role *</label>
							<select id="newRole" name="role" required class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
								{#each Object.entries(RoleLabels) as [value, label]}
									<option {value}>{label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="newPerson" class="mb-1 block text-sm font-medium">Person</label>
							<select id="newPerson" name="personId" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
								<option value="">Unassigned</option>
								{#each data.people as person}
									<option value={person.id}>
										{person.title ? person.title + ' ' : ''}{person.firstName} {person.lastName}
									</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="newRoleLabel" class="mb-1 block text-sm font-medium">Custom Label</label>
							<input type="text" id="newRoleLabel" name="roleLabel" placeholder="e.g. First Reader" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
						</div>
						<div>
							<label for="newStatus" class="mb-1 block text-sm font-medium">Status</label>
							<select id="newStatus" name="invitationStatus" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
								{#each Object.entries(InvitationStatusLabels) as [value, label]}
									<option {value}>{label}</option>
								{/each}
							</select>
						</div>
					</div>
					<div>
						<label for="newRoleNotes" class="mb-1 block text-sm font-medium">Notes</label>
						<input type="text" id="newRoleNotes" name="notes" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
					</div>
					<button type="submit" class="preset-filled-primary-500 rounded px-4 py-2 text-sm">Add Role</button>
				</form>
			{/if}

			{#if data.service.roles.length === 0}
				<p class="text-surface-500 py-8 text-center">No roles assigned yet.</p>
			{:else}
				<div class="space-y-3">
					{#each data.service.roles as role}
						<div class="border-surface-300 rounded border p-4">
							<div class="flex items-start justify-between">
								<div>
									<div class="flex items-center gap-2">
										<span class="font-medium">{RoleLabels[role.role as keyof typeof RoleLabels] ?? role.role}</span>
										{#if role.roleLabel}
											<span class="text-surface-500 text-sm">({role.roleLabel})</span>
										{/if}
									</div>
									<div class="text-surface-700 mt-1 text-sm">
										{#if role.personId}
											<a href="/people/{role.personId}" class="text-primary-600 hover:underline">{personDisplayName(role)}</a>
											{#if role.personEmail}
												<span class="text-surface-9000"> &middot; {role.personEmail}</span>
											{/if}
										{:else}
											<span class="text-surface-9000 italic">Unassigned</span>
										{/if}
									</div>
									{#if role.notes}
										<div class="text-surface-500 mt-1 text-xs">{role.notes}</div>
									{/if}
									{#if role.invitedAt}
										<div class="text-surface-9000 mt-1 text-xs">Invited: {formatDate(role.invitedAt)}</div>
									{/if}
									{#if role.respondedAt}
										<div class="text-surface-9000 text-xs">Responded: {formatDate(role.respondedAt)}</div>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<span class="rounded px-2 py-0.5 text-xs {statusColour(role.invitationStatus)}">
										{InvitationStatusLabels[role.invitationStatus as keyof typeof InvitationStatusLabels] ?? role.invitationStatus}
									</span>
								</div>
							</div>

							<!-- Status workflow buttons -->
							<div class="mt-3 flex flex-wrap items-center gap-2 border-t border-surface-300 pt-3">
								{#if role.invitationStatus === 'possibility'}
									<form method="POST" action="?/updateStatus" class="inline">
										<input type="hidden" name="roleId" value={role.id} />
										<input type="hidden" name="status" value="requested" />
										<button type="submit" class="rounded bg-blue-100 px-3 py-1 text-xs text-blue-800 hover:bg-blue-800">Mark Requested</button>
									</form>
								{/if}
								{#if role.invitationStatus === 'requested'}
									<form method="POST" action="?/updateStatus" class="inline">
										<input type="hidden" name="roleId" value={role.id} />
										<input type="hidden" name="status" value="accepted" />
										<button type="submit" class="rounded bg-green-100 px-3 py-1 text-xs text-green-200 hover:bg-green-800">Accept</button>
									</form>
									<form method="POST" action="?/updateStatus" class="inline">
										<input type="hidden" name="roleId" value={role.id} />
										<input type="hidden" name="status" value="declined" />
										<button type="submit" class="rounded bg-red-100 px-3 py-1 text-xs text-red-800 hover:bg-red-800">Decline</button>
									</form>
								{/if}
								{#if role.invitationStatus === 'declined'}
									<form method="POST" action="?/updateStatus" class="inline">
										<input type="hidden" name="roleId" value={role.id} />
										<input type="hidden" name="status" value="possibility" />
										<button type="submit" class="rounded bg-surface-700 px-3 py-1 text-xs text-surface-700 hover:bg-surface-600">Reset</button>
									</form>
								{/if}
								{#if role.invitationStatus === 'accepted'}
									<form method="POST" action="?/updateStatus" class="inline">
										<input type="hidden" name="roleId" value={role.id} />
										<input type="hidden" name="status" value="possibility" />
										<button type="submit" class="rounded bg-surface-700 px-3 py-1 text-xs text-surface-700 hover:bg-surface-600">Reset</button>
									</form>
								{/if}

								<button class="text-surface-500 ml-auto text-xs hover:text-surface-700" onclick={() => editingRoleId = editingRoleId === role.id ? null : role.id}>
									{editingRoleId === role.id ? 'Cancel Edit' : 'Edit'}
								</button>

								<form method="POST" action="?/removeRole" class="inline">
									<input type="hidden" name="roleId" value={role.id} />
									<button type="submit" class="text-xs text-red-400 hover:text-red-300" onclick={(e) => { if (!confirm('Remove this role assignment?')) e.preventDefault(); }}>Remove</button>
								</form>
							</div>

							<!-- Inline edit form -->
							{#if editingRoleId === role.id}
								<form method="POST" action="?/updateRole" class="mt-3 space-y-3 border-t border-surface-300 pt-3">
									<input type="hidden" name="roleId" value={role.id} />
									<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
										<div>
											<label for="editRole-{role.id}" class="mb-1 block text-xs font-medium">Role</label>
											<select id="editRole-{role.id}" name="role" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm">
												{#each Object.entries(RoleLabels) as [value, label]}
													<option {value} selected={value === role.role}>{label}</option>
												{/each}
											</select>
										</div>
										<div>
											<label for="editPerson-{role.id}" class="mb-1 block text-xs font-medium">Person</label>
											<select id="editPerson-{role.id}" name="personId" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm">
												<option value="">Unassigned</option>
												{#each data.people as person}
													<option value={person.id} selected={person.id === role.personId}>
														{person.title ? person.title + ' ' : ''}{person.firstName} {person.lastName}
													</option>
												{/each}
											</select>
										</div>
									</div>
									<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
										<div>
											<label for="editRoleLabel-{role.id}" class="mb-1 block text-xs font-medium">Custom Label</label>
											<input type="text" id="editRoleLabel-{role.id}" name="roleLabel" value={role.roleLabel ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
										</div>
										<div>
											<label for="editNotes-{role.id}" class="mb-1 block text-xs font-medium">Notes</label>
											<input type="text" id="editNotes-{role.id}" name="notes" value={role.notes ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
										</div>
									</div>
									<button type="submit" class="preset-filled-primary-500 rounded px-4 py-1.5 text-sm">Save</button>
								</form>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

	{:else if activeTab === 'hospitality'}
		<div class="max-w-2xl">
			<h2 class="mb-4 text-lg font-semibold">Hospitality for External Visitors</h2>
			{#if externalRoles.length === 0}
				<p class="text-surface-500 py-8 text-center">No external visitors assigned to this service. Add non-college-member roles first.</p>
			{:else}
				<div class="space-y-4">
					{#each externalRoles as role}
						{@const hosp = role.hospitality}
						<div class="border-surface-300 rounded border p-4">
							<div class="mb-3 flex items-center justify-between">
								<div>
									<span class="font-medium">{personDisplayName(role)}</span>
									<span class="text-surface-500 text-sm"> — {RoleLabels[role.role as keyof typeof RoleLabels] ?? role.role}</span>
								</div>
								<button class="text-primary-600 text-sm hover:underline" onclick={() => hospitalityRoleId = hospitalityRoleId === role.id ? null : role.id}>
									{hospitalityRoleId === role.id ? 'Close' : hosp ? 'Edit' : 'Add Details'}
								</button>
							</div>

							{#if hosp}
								<div class="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
									<div>
										<span class="text-surface-500 text-xs">Accommodation</span>
										<div>{BookingStatusLabels[hosp.accommodationStatus ?? 'not_needed']}</div>
									</div>
									<div>
										<span class="text-surface-500 text-xs">Meals</span>
										<div>{BookingStatusLabels[hosp.mealStatus ?? 'not_needed']}</div>
									</div>
									<div>
										<span class="text-surface-500 text-xs">Parking</span>
										<div>{BookingStatusLabels[hosp.parkingStatus ?? 'not_needed']}</div>
									</div>
									<div>
										<span class="text-surface-500 text-xs">Expenses</span>
										<div>
											{BookingStatusLabels[hosp.expensesStatus ?? 'not_needed']}
											{#if hosp.expensesAmount}
												<span class="text-surface-700"> (&pound;{hosp.expensesAmount.toFixed(2)})</span>
											{/if}
										</div>
									</div>
								</div>
							{:else}
								<p class="text-surface-9000 text-sm">No hospitality details recorded.</p>
							{/if}

							{#if hospitalityRoleId === role.id}
								<form method="POST" action="?/saveHospitality" class="mt-4 space-y-4 border-t border-surface-300 pt-4">
									<input type="hidden" name="roleId" value={role.id} />

									<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<label for="accStatus-{role.id}" class="mb-1 block text-xs font-medium">Accommodation</label>
											<select id="accStatus-{role.id}" name="accommodationStatus" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm">
												{#each Object.entries(BookingStatusLabels) as [value, label]}
													<option {value} selected={value === (hosp?.accommodationStatus ?? 'not_needed')}>{label}</option>
												{/each}
											</select>
										</div>
										<div>
											<label for="accNotes-{role.id}" class="mb-1 block text-xs font-medium">Accommodation Notes</label>
											<input type="text" id="accNotes-{role.id}" name="accommodationNotes" value={hosp?.accommodationNotes ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
										</div>
									</div>
									<div>
										<label for="accDates-{role.id}" class="mb-1 block text-xs font-medium">Accommodation Dates</label>
										<input type="text" id="accDates-{role.id}" name="accommodationDates" placeholder="e.g. 2025-10-15, 2025-10-16" value={hosp?.accommodationDates ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
									</div>

									<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<label for="mealStatus-{role.id}" class="mb-1 block text-xs font-medium">Meals</label>
											<select id="mealStatus-{role.id}" name="mealStatus" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm">
												{#each Object.entries(BookingStatusLabels) as [value, label]}
													<option {value} selected={value === (hosp?.mealStatus ?? 'not_needed')}>{label}</option>
												{/each}
											</select>
										</div>
										<div>
											<label for="mealNotes-{role.id}" class="mb-1 block text-xs font-medium">Meal Notes</label>
											<input type="text" id="mealNotes-{role.id}" name="mealNotes" value={hosp?.mealNotes ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
										</div>
									</div>

									<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<label for="parkStatus-{role.id}" class="mb-1 block text-xs font-medium">Parking</label>
											<select id="parkStatus-{role.id}" name="parkingStatus" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm">
												{#each Object.entries(BookingStatusLabels) as [value, label]}
													<option {value} selected={value === (hosp?.parkingStatus ?? 'not_needed')}>{label}</option>
												{/each}
											</select>
										</div>
										<div>
											<label for="parkNotes-{role.id}" class="mb-1 block text-xs font-medium">Parking Notes</label>
											<input type="text" id="parkNotes-{role.id}" name="parkingNotes" value={hosp?.parkingNotes ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
										</div>
									</div>

									<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
										<div>
											<label for="expStatus-{role.id}" class="mb-1 block text-xs font-medium">Expenses</label>
											<select id="expStatus-{role.id}" name="expensesStatus" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm">
												{#each Object.entries(BookingStatusLabels) as [value, label]}
													<option {value} selected={value === (hosp?.expensesStatus ?? 'not_needed')}>{label}</option>
												{/each}
											</select>
										</div>
										<div>
											<label for="expAmount-{role.id}" class="mb-1 block text-xs font-medium">Amount (&pound;)</label>
											<input type="number" id="expAmount-{role.id}" name="expensesAmount" step="0.01" value={hosp?.expensesAmount ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
										</div>
										<div>
											<label for="expNotes-{role.id}" class="mb-1 block text-xs font-medium">Expenses Notes</label>
											<input type="text" id="expNotes-{role.id}" name="expensesNotes" value={hosp?.expensesNotes ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
										</div>
									</div>

									<button type="submit" class="preset-filled-primary-500 rounded px-4 py-1.5 text-sm">Save Hospitality</button>
								</form>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

	{:else if activeTab === 'readings'}
		<div class="max-w-2xl">
			<!-- Lectionary suggestion -->
			{#if data.lectionaryOccasion && data.suggestedReadings.length > 0 && data.service.readings.length === 0}
				<div class="mb-6 rounded border border-blue-800 bg-blue-950 p-4">
					<h3 class="mb-2 font-medium text-blue-800">Suggested Readings — {data.lectionaryOccasion.name}</h3>
					<p class="mb-3 text-sm text-blue-300">
						Lectionary readings for {data.lectionaryOccasion.liturgicalYear ? `Year ${data.lectionaryOccasion.liturgicalYear}` : 'this date'} ({data.service.rite === 'BCP' ? 'BCP' : 'CW'} tradition)
					</p>
					<div class="mb-3 space-y-1">
						{#each data.suggestedReadings as reading}
							<div class="flex items-baseline gap-3 text-sm">
								<span class="w-28 shrink-0 text-blue-400">
									{ReadingTypeLabels[reading.readingType as keyof typeof ReadingTypeLabels] ?? reading.readingType}
								</span>
								<span class="text-blue-100">{reading.reference}</span>
							</div>
						{/each}
					</div>
					<form method="POST" action="?/acceptSuggested">
						{#each data.suggestedReadings as reading}
							<input type="hidden" name="readingId" value={reading.id} />
							<input type="hidden" name="readingType" value={reading.readingType} />
							<input type="hidden" name="reference" value={reading.reference} />
						{/each}
						<button type="submit" class="rounded bg-blue-800 px-4 py-1.5 text-sm text-blue-100 hover:bg-blue-700">Accept All Suggested Readings</button>
					</form>
				</div>
			{/if}

			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Assigned Readings</h2>
				<button class="preset-filled-primary-500 rounded px-4 py-1.5 text-sm" onclick={() => showAddReading = !showAddReading}>
					{showAddReading ? 'Cancel' : 'Add Reading'}
				</button>
			</div>

			{#if showAddReading}
				<form method="POST" action="?/addReading" class="border-surface-300 mb-6 space-y-4 rounded border p-4">
					<h3 class="font-medium">Add Reading</h3>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="newReadingType" class="mb-1 block text-sm font-medium">Type *</label>
							<select id="newReadingType" name="readingType" required class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
								{#each Object.entries(ReadingTypeLabels) as [value, label]}
									<option {value}>{label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="newReference" class="mb-1 block text-sm font-medium">Reference *</label>
							<input type="text" id="newReference" name="reference" required placeholder="e.g. Isaiah 40.1–11" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
						</div>
					</div>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="newReader" class="mb-1 block text-sm font-medium">Reader</label>
							<select id="newReader" name="readerId" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
								<option value="">Unassigned</option>
								{#each data.people as person}
									<option value={person.id}>
										{person.title ? person.title + ' ' : ''}{person.firstName} {person.lastName}
									</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="newReadingSortOrder" class="mb-1 block text-sm font-medium">Order</label>
							<input type="number" id="newReadingSortOrder" name="sortOrder" value={data.service.readings.length + 1} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
						</div>
					</div>
					<div>
						<label for="newReadingNotes" class="mb-1 block text-sm font-medium">Notes</label>
						<input type="text" id="newReadingNotes" name="notes" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
					</div>
					<div class="flex items-center gap-2">
						<input type="checkbox" id="newIsOverride" name="isOverride" class="h-4 w-4" />
						<label for="newIsOverride" class="text-sm">Override lectionary</label>
					</div>
					<button type="submit" class="preset-filled-primary-500 rounded px-4 py-2 text-sm">Add Reading</button>
				</form>
			{/if}

			{#if data.service.readings.length === 0}
				<p class="text-surface-500 py-8 text-center">No readings assigned yet.</p>
			{:else}
				<div class="space-y-3">
					{#each data.service.readings as reading}
						<div class="border-surface-300 rounded border p-4">
							<div class="flex items-start justify-between">
								<div>
									<span class="text-surface-500 text-sm">
										{ReadingTypeLabels[reading.readingType as keyof typeof ReadingTypeLabels] ?? reading.readingType}
									</span>
									{#if reading.isOverride}
										<span class="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800">Override</span>
									{/if}
									<div class="font-medium">{reading.reference}</div>
									{#if reading.readerFirstName}
										<div class="text-surface-500 mt-1 text-sm">
											Reader: {reading.readerTitle ? reading.readerTitle + ' ' : ''}{reading.readerFirstName} {reading.readerLastName}
										</div>
									{/if}
									{#if reading.notes}
										<div class="text-surface-500 mt-1 text-xs">{reading.notes}</div>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<button class="text-surface-500 text-xs hover:text-surface-700" onclick={() => editingReadingId = editingReadingId === reading.id ? null : reading.id}>
										{editingReadingId === reading.id ? 'Cancel' : 'Edit'}
									</button>
									<form method="POST" action="?/removeReading" class="inline">
										<input type="hidden" name="readingId" value={reading.id} />
										<button type="submit" class="text-xs text-red-400 hover:text-red-300" onclick={(e) => { if (!confirm('Remove this reading?')) e.preventDefault(); }}>Remove</button>
									</form>
								</div>
							</div>

							{#if editingReadingId === reading.id}
								<form method="POST" action="?/updateReading" class="mt-3 space-y-3 border-t border-surface-300 pt-3">
									<input type="hidden" name="readingId" value={reading.id} />
									<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
										<div>
											<label for="editReadingType-{reading.id}" class="mb-1 block text-xs font-medium">Type</label>
											<select id="editReadingType-{reading.id}" name="readingType" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm">
												{#each Object.entries(ReadingTypeLabels) as [value, label]}
													<option {value} selected={value === reading.readingType}>{label}</option>
												{/each}
											</select>
										</div>
										<div>
											<label for="editReference-{reading.id}" class="mb-1 block text-xs font-medium">Reference</label>
											<input type="text" id="editReference-{reading.id}" name="reference" value={reading.reference} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
										</div>
									</div>
									<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
										<div>
											<label for="editReader-{reading.id}" class="mb-1 block text-xs font-medium">Reader</label>
											<select id="editReader-{reading.id}" name="readerId" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm">
												<option value="">Unassigned</option>
												{#each data.people as person}
													<option value={person.id} selected={person.id === reading.readerId}>
														{person.title ? person.title + ' ' : ''}{person.firstName} {person.lastName}
													</option>
												{/each}
											</select>
										</div>
										<div>
											<label for="editReadingNotes-{reading.id}" class="mb-1 block text-xs font-medium">Notes</label>
											<input type="text" id="editReadingNotes-{reading.id}" name="notes" value={reading.notes ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
										</div>
									</div>
									<button type="submit" class="preset-filled-primary-500 rounded px-4 py-1.5 text-sm">Save</button>
								</form>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

	{:else if activeTab === 'music'}
		<div class="max-w-2xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Service Music</h2>
				<button class="preset-filled-primary-500 rounded px-4 py-1.5 text-sm" onclick={() => showAddMusic = !showAddMusic}>
					{showAddMusic ? 'Cancel' : 'Add Music'}
				</button>
			</div>

			{#if showAddMusic}
				<form method="POST" action="?/addMusic" class="border-surface-300 mb-6 space-y-4 rounded border p-4">
					<h3 class="font-medium">Add Music</h3>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="newMusicType" class="mb-1 block text-sm font-medium">Type *</label>
							<select id="newMusicType" name="musicType" required class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
								{#each Object.entries(MusicTypeLabels) as [value, label]}
									<option {value}>{label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="newMusicPosition" class="mb-1 block text-sm font-medium">Position</label>
							<select id="newMusicPosition" name="position" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
								<option value="">—</option>
								{#each Object.entries(MusicPositionLabels) as [value, label]}
									<option {value}>{label}</option>
								{/each}
							</select>
						</div>
					</div>
					<div>
						<label for="newHymn" class="mb-1 block text-sm font-medium">Hymn (from database)</label>
						<select id="newHymn" name="hymnId" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2">
							<option value="">— Select or leave blank for non-hymn music —</option>
							{#each data.hymns as hymn}
								<option value={hymn.id}>
									{hymn.hymnalName && hymn.hymnNumber ? `${hymn.hymnalName} ${hymn.hymnNumber} — ` : ''}{hymn.title}{hymn.tune ? ` (${hymn.tune})` : ''}
								</option>
							{/each}
						</select>
					</div>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="newMusicTitle" class="mb-1 block text-sm font-medium">Title (for non-hymn)</label>
							<input type="text" id="newMusicTitle" name="title" placeholder="e.g. Anthem title" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
						</div>
						<div>
							<label for="newComposer" class="mb-1 block text-sm font-medium">Composer</label>
							<input type="text" id="newComposer" name="composer" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-2" />
						</div>
					</div>
					<div>
						<label for="newMusicOrder" class="mb-1 block text-sm font-medium">Order</label>
						<input type="number" id="newMusicOrder" name="sortOrder" value={data.service.music.length + 1} class="input w-32 rounded border border-surface-300 bg-surface-100 px-3 py-2" />
					</div>
					<button type="submit" class="preset-filled-primary-500 rounded px-4 py-2 text-sm">Add Music</button>
				</form>
			{/if}

			{#if data.service.music.length === 0}
				<p class="text-surface-500 py-8 text-center">No music assigned yet.</p>
			{:else}
				<div class="space-y-3">
					{#each data.service.music as item}
						<div class="border-surface-300 rounded border p-4">
							<div class="flex items-start justify-between">
								<div>
									<div class="flex items-center gap-2">
										{#if item.position}
											<span class="rounded bg-surface-700 px-2 py-0.5 text-xs text-surface-700">
												{MusicPositionLabels[item.position] ?? item.position}
											</span>
										{/if}
										<span class="text-surface-500 text-xs">
											{MusicTypeLabels[item.musicType] ?? item.musicType}
										</span>
									</div>
									<div class="mt-1 font-medium">{musicDisplayTitle(item)}</div>
									{#if item.composer}
										<div class="text-surface-500 text-sm">{item.composer}</div>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<button class="text-surface-500 text-xs hover:text-surface-700" onclick={() => editingMusicId = editingMusicId === item.id ? null : item.id}>
										{editingMusicId === item.id ? 'Cancel' : 'Edit'}
									</button>
									<form method="POST" action="?/removeMusic" class="inline">
										<input type="hidden" name="musicId" value={item.id} />
										<button type="submit" class="text-xs text-red-400 hover:text-red-300" onclick={(e) => { if (!confirm('Remove this music?')) e.preventDefault(); }}>Remove</button>
									</form>
								</div>
							</div>

							{#if editingMusicId === item.id}
								<form method="POST" action="?/updateMusic" class="mt-3 space-y-3 border-t border-surface-300 pt-3">
									<input type="hidden" name="musicId" value={item.id} />
									<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
										<div>
											<label for="editMusicType-{item.id}" class="mb-1 block text-xs font-medium">Type</label>
											<select id="editMusicType-{item.id}" name="musicType" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm">
												{#each Object.entries(MusicTypeLabels) as [value, label]}
													<option {value} selected={value === item.musicType}>{label}</option>
												{/each}
											</select>
										</div>
										<div>
											<label for="editPosition-{item.id}" class="mb-1 block text-xs font-medium">Position</label>
											<select id="editPosition-{item.id}" name="position" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm">
												<option value="">—</option>
												{#each Object.entries(MusicPositionLabels) as [value, label]}
													<option {value} selected={value === item.position}>{label}</option>
												{/each}
											</select>
										</div>
									</div>
									<div>
										<label for="editHymn-{item.id}" class="mb-1 block text-xs font-medium">Hymn</label>
										<select id="editHymn-{item.id}" name="hymnId" class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm">
											<option value="">— None —</option>
											{#each data.hymns as hymn}
												<option value={hymn.id} selected={hymn.id === item.hymnId}>
													{hymn.hymnalName && hymn.hymnNumber ? `${hymn.hymnalName} ${hymn.hymnNumber} — ` : ''}{hymn.title}
												</option>
											{/each}
										</select>
									</div>
									<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
										<div>
											<label for="editMusicTitle-{item.id}" class="mb-1 block text-xs font-medium">Title</label>
											<input type="text" id="editMusicTitle-{item.id}" name="title" value={item.title ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
										</div>
										<div>
											<label for="editComposer-{item.id}" class="mb-1 block text-xs font-medium">Composer</label>
											<input type="text" id="editComposer-{item.id}" name="composer" value={item.composer ?? ''} class="input w-full rounded border border-surface-300 bg-surface-100 px-3 py-1.5 text-sm" />
										</div>
									</div>
									<button type="submit" class="preset-filled-primary-500 rounded px-4 py-1.5 text-sm">Save</button>
								</form>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
