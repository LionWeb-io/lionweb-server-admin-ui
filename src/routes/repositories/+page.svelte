<script lang="ts">
  import { onMount } from 'svelte';
  import type { Repository, RepositoryListResponse } from '$lib/types';
  import { getRepositories } from '$lib/services/repository';

  let repositories: string[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    await loadRepositories();
  });

  async function loadRepositories() {
    try {
      const response = await getRepositories();
      if (response.success) {
        repositories = response.repositoryNames;
      } else {
        error = response.messages[0]?.message || 'Failed to load repositories';
      }
    } catch (e) {
      error = `Failed to load repositories: ${e instanceof Error ? e.message : 'Unknown error'}`;
      console.error('Error details:', e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white shadow rounded-lg">
  <div class="px-4 py-5 sm:p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Repositories</h2>
    </div>

    {#if loading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    {:else if error}
      <div class="text-center py-12">
        <p class="text-red-600">{error}</p>
        <p class="text-sm text-gray-500 mt-2">Please check if the LionWeb Repository server is running at {import.meta.env.VITE_API_BASE_URL}</p>
      </div>
    {:else if repositories.length === 0}
      <div class="text-center py-12">
        <p class="text-gray-500">No repositories found</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each repositories as repositoryName}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{repositoryName}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a
                    href="/explore/{repositoryName}"
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    Explore
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div> 