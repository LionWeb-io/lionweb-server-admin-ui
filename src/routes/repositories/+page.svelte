<script lang="ts">
  import { onMount } from 'svelte';
  import type { Repository, CreateRepositoryRequest } from '$lib/types';
  import { getRepositories, createRepository, deleteRepository } from '$lib/services/repository';

  let repositories: Repository[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateModal = false;
  let newRepository: CreateRepositoryRequest = {
    name: '',
    description: '',
    owner: '',
    version: '2024.1',
    languages: []
  };

  onMount(async () => {
    await loadRepositories();
  });

  async function loadRepositories() {
    try {
      const response = await getRepositories();
      repositories = response.repositories;
    } catch (e) {
      error = `Failed to load repositories: ${e instanceof Error ? e.message : 'Unknown error'}`;
      console.error('Error details:', e);
    } finally {
      loading = false;
    }
  }

  async function handleCreateRepository() {
    try {
      const repository = await createRepository(newRepository);
      repositories = [...repositories, repository];
      showCreateModal = false;
      newRepository = {
        name: '',
        description: '',
        owner: '',
        version: '2024.1',
        languages: []
      };
    } catch (e) {
      error = 'Failed to create repository';
      console.error(e);
    }
  }

  async function handleDeleteRepository(id: string) {
    if (!confirm('Are you sure you want to delete this repository?')) {
      return;
    }

    try {
      await deleteRepository(id);
      repositories = repositories.filter(r => r.id !== id);
    } catch (e) {
      error = 'Failed to delete repository';
      console.error(e);
    }
  }
</script>

<div class="bg-white shadow rounded-lg">
  <div class="px-4 py-5 sm:p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Repositories</h2>
      <button
        on:click={() => showCreateModal = true}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Create Repository
      </button>
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
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Languages</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nodes</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each repositories as repository}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{repository.name}</div>
                  <div class="text-sm text-gray-500">Owner: {repository.owner}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{repository.description}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{repository.version}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    {#each repository.languages as language}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {language}
                      </span>
                    {/each}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {repository.nodeCount}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    on:click={() => handleDeleteRepository(repository.id)}
                    class="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

{#if showCreateModal}
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Repository</h3>
      <form on:submit|preventDefault={handleCreateRepository}>
        <div class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              bind:value={newRepository.name}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              bind:value={newRepository.description}
              rows="3"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            ></textarea>
          </div>
          <div>
            <label for="owner" class="block text-sm font-medium text-gray-700">Owner</label>
            <input
              type="text"
              id="owner"
              bind:value={newRepository.owner}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label for="version" class="block text-sm font-medium text-gray-700">Version</label>
            <input
              type="text"
              id="version"
              bind:value={newRepository.version}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label for="languages" class="block text-sm font-medium text-gray-700">Languages (comma-separated)</label>
            <input
              type="text"
              id="languages"
              bind:value={newRepository.languages}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., java, python, typescript"
            />
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            on:click={() => showCreateModal = false}
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
{/if} 