<script lang="ts">
	import '../app.css';
</script>

<div class="min-h-screen bg-gray-100">
	<nav class="bg-white shadow-lg">
		<div class="mx-auto max-w-7xl px-4">
			<div class="flex h-16 justify-between">
				<div class="flex">
					<div class="flex flex-shrink-0 items-center">
						<a href="/repositories" class="flex items-center space-x-2">
							<img src="/images/lionweb-logo.png" alt="LionWeb Logo" class="h-8 w-auto" />
							<span class="text-xl font-bold text-gray-800">LionWeb Repo Admin</span>
						</a>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a
							href="/repositories"
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						>
							Repositories
						</a>
						<a
							href="/explore"
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						>
							Partitions
						</a>
						<a
							href="/playground"
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						>
							Files
						</a>
					</div>
				</div>
			</div>
		</div>
	</nav>

	<main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<slot />
		</div>
	</main>
</div>
