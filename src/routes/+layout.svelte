<script lang="ts">
	import '../app.css';

	let { children } = $props();

	let mobileNavOpen = $state(false);

	const navLinks = [
		{ href: '/services', label: 'Services' },
		{ href: '/blocks', label: 'Blocks' },
		{ href: '/people', label: 'People' },
		{ href: '/calendar', label: 'Calendar' },
		{ href: '/lectionary', label: 'Lectionary' }
	];
</script>

<svelte:head>
	<title>Chapel Planner</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<header class="bg-surface-50 text-surface-900 border-surface-300 border-b">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
			<a href="/" class="text-lg font-semibold">Chapel Planner</a>

			<!-- Desktop nav -->
			<nav class="hidden gap-4 md:flex" aria-label="Main navigation">
				{#each navLinks as link}
					<a href={link.href} class="hover:text-primary-600 transition-colors">{link.label}</a>
				{/each}
			</nav>

			<!-- Mobile menu button -->
			<button
				class="md:hidden rounded p-1 text-surface-700 hover:text-surface-700"
				onclick={() => mobileNavOpen = !mobileNavOpen}
				aria-label="Toggle navigation menu"
				aria-expanded={mobileNavOpen}
			>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					{#if mobileNavOpen}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					{/if}
				</svg>
			</button>
		</div>

		<!-- Mobile nav -->
		{#if mobileNavOpen}
			<nav class="border-surface-300 border-t px-4 pb-3 md:hidden" aria-label="Mobile navigation">
				{#each navLinks as link}
					<a
						href={link.href}
						class="hover:text-primary-600 block py-2 transition-colors"
						onclick={() => mobileNavOpen = false}
					>{link.label}</a>
				{/each}
			</nav>
		{/if}
	</header>

	<main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
		{@render children()}
	</main>

	<footer class="text-surface-500 border-surface-300 border-t py-4 text-center text-sm">
		Chapel Planner
	</footer>
</div>
