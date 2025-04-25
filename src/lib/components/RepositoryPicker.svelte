<script>
	const repositoryName = "Foo Repository";
	const repositories = [
		{
			name: "Foo Repository",
			lionweb_version: "2023.1",
			history: false
		},
		{
			name: "Other Repository",
			lionweb_version: "2024.1",
			history: true
		},
	];
	function handleRepositoryChange() {

	}
</script>

<div class="relative w-96 rounded-lg border border-gray-200 bg-white p-2 shadow-md">
	<select
		id="repository"
		value={repositoryName}
		on:change={handleRepositoryChange}
		class="mt-1 block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 text-lg focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
	>
		{#each repositories as repo}
			<option value={repo.name}>
				{repo.name}
			</option>
		{/each}
	</select>
	{#if repositories.find((r) => r.name === repositoryName)}
		{@const selectedRepo = repositories.find((r) => r.name === repositoryName)}
		<div class="mt-2 flex flex-wrap gap-2">
							<span
								class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
							>
								LionWeb {selectedRepo?.lionweb_version}
							</span>
			{#if selectedRepo?.history}
								<span
									class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
								>
									History Enabled
								</span>
			{:else}
								<span
									class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
								>
									History Disabled
								</span>
			{/if}
		</div>
	{/if}
</div>
