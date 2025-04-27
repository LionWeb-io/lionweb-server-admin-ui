<script lang="ts">
	import { onMount } from 'svelte';

	let iframeLoaded = false;

	onMount(() => {
		iframeLoaded = true;
	});
</script>

<div class="flex min-h-screen bg-white">
	<!-- Main Content Area -->
	<div class="flex-1 flex flex-col">
		<!-- Header -->
		<div class="border-b border-gray-200 px-6 py-4">
			<h1 class="text-2xl font-semibold text-gray-900">Python Playground</h1>
			<p class="mt-1 text-sm text-gray-500">Interactive Python environment powered by JupyterLite</p>
		</div>

		<!-- Content -->
		<div class="flex-1">
			{#if iframeLoaded}
				<iframe
					src="https://jupyterlite.github.io/demo/repl/index.html?kernel=python"
					class="w-full h-full border-0"
					title="JupyterLite Python Playground"
				/>
			{:else}
				<div class="flex items-center justify-center h-full">
					<div class="text-center">
						<div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
						<p class="mt-4 text-sm text-gray-500">Loading Python playground...</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div> 