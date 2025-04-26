<script lang="ts">
	import '../app.css';
	import RepositoryPicker from '$lib/components/RepositoryPicker.svelte';
	import PartitionPicker from '$lib/components/PartitionPicker.svelte';
	import InstanceRootLink from '$lib/components/InstanceRootLink.svelte';
	import { page } from '$app/stores';

	$: isNodeDetailsPage = Boolean($page.params.repository && $page.params.id);
</script>

<div class="min-h-screen bg-gray-100">
	<nav class="bg-white shadow-lg">
		<div class="mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<a href="/repositories" class="flex items-center space-x-4">
					<img src="/images/lionweb-logo.png" alt="LionWeb Logo" class="h-24 w-auto transition-transform hover:scale-105" />
					<div>
						<h1 class="text-4xl font-bold text-gray-800 headline">LionWeb Repository Admin Panel</h1>
						<p class="text-sm text-gray-500">at http://localhost:3005</p>
					</div>
				</a>
			</div>

			{#if $page.url.pathname !== '/'}
				<div class="mt-6 flex items-center space-x-2">
					<div class="breadcrumbs flex items-center space-x-2 p-2">
						<div class="step root">
							<InstanceRootLink/>
						</div>
						<div class="chevron text-gray-400">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
							</svg>
						</div>
						{#if $page.params.repository}
							<div class="step repository">
								<RepositoryPicker/>
							</div>
							{#if $page.params.id}
								<div class="chevron text-gray-400">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
									</svg>
								</div>
								<div class="step partition">
									<PartitionPicker/>
								</div>
							{/if}
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</nav>

	<main class={isNodeDetailsPage ? 'w-full py-6 px-2 max-w-screen-3xl mx-auto' : 'mx-auto max-w-7xl py-6 sm:px-6 lg:px-8'}>
		<div class={isNodeDetailsPage ? 'py-6' : 'px-4 py-6 sm:px-0'}>
			<slot />
		</div>
	</main>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:wght@500;700&display=swap');

	.headline {
		font-family: 'Inter', sans-serif;
	}

	.step {
		display: inline-flex;
		align-items: center;
		height: 48px;
		padding: 0 1rem;
		background-color: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	.step:hover {
		border-color: #3b82f6;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.step.root {
		background-color: #f3f4f6;
	}

	.chevron {
		display: flex;
		align-items: center;
		height: 48px;
	}
</style>
