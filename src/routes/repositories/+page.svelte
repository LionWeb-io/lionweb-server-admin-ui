<script lang="ts">
  import { onMount } from 'svelte';
  import type { Repository, RepositoryListResponse } from '$lib/types';
  import { getRepositories, createRepository, deleteRepository } from '$lib/services/repository';

  let repositories: Repository[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateModal = false;
  let showDeleteConfirm = false;
  let repositoryToDelete: Repository | null = null;
  let createError: string | null = null;
  
  // Form data for new repository
  let newRepository = {
    name: '',
    lionweb_version: '2024.1',
    history: false
  };

  onMount(async () => {
    await loadRepositories();
  });

  async function loadRepositories() {
    try {
      const response = await getRepositories();
      console.log('Repository response:', JSON.stringify(response, null, 2));
      if (response.success) {
        repositories = response.repositories;
        console.log('Repositories array:', JSON.stringify(repositories, null, 2));
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

  async function handleCreateRepository() {
    try {
      loading = true;
      error = null;
      createError = null;
      
      // Basic validation
      if (!newRepository.name.trim()) {
        createError = 'Repository name is required';
        return;
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(newRepository.name)) {
        createError = 'Repository name can only contain letters, numbers, underscores, and hyphens';
        return;
      }
      
      await createRepository({
        name: newRepository.name,
        lionweb_version: newRepository.lionweb_version,
        history: newRepository.history
      });
      
      // Reset form and close modal
      newRepository = {
        name: '',
        lionweb_version: '2024.1',
        history: false
      };
      showCreateModal = false;
      
      // Reload the list
      await loadRepositories();
    } catch (e) {
      createError = e instanceof Error ? e.message : 'Failed to create repository';
      console.error('Error details:', e);
    } finally {
      loading = false;
    }
  }

  async function handleDeleteRepository() {
    if (!repositoryToDelete) return;
    
    try {
      loading = true;
      error = null;
      
      await deleteRepository(repositoryToDelete.repository_name);
      
      // Reset state and close modal
      repositoryToDelete = null;
      showDeleteConfirm = false;
      
      // Reload the list
      await loadRepositories();
    } catch (e) {
      error = `Failed to delete repository: ${e instanceof Error ? e.message : 'Unknown error'}`;
      console.error('Error details:', e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white shadow rounded-lg">
  <div class="px-4 py-5 sm:p-6">
    <div class="mb-6">
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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each repositories as repository}
          <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">{repository.repository_name}</h3>
              
              <div class="flex flex-wrap gap-2 mb-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {repository.lionweb_version}
                </span>
                {#if repository.history}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    History Enabled
                  </span>
                {:else}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    History Disabled
                  </span>
                {/if}
              </div>

              <div class="flex justify-end space-x-2">
                <a
                  href="/explore?repository={repository.repository_name}"
                  class="inline-flex items-center p-2 border border-transparent rounded-full text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  title="Explore Repository"
                >
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                  </svg>
                  <span class="sr-only">Explore</span>
                </a>
                <button
                  on:click={() => {
                    repositoryToDelete = repository;
                    showDeleteConfirm = true;
                  }}
                  class="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  title="Delete Repository"
                >
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  <span class="sr-only">Delete</span>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <div class="mt-6 flex justify-center">
      <button
        on:click={() => showCreateModal = true}
        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Create Repository
      </button>
    </div>
  </div>
</div>

<!-- Create Repository Modal -->
{#if showCreateModal}
  <div class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <div>
          <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">Create New Repository</h3>
          <div class="mt-4">
            <form on:submit|preventDefault={handleCreateRepository}>
              {#if createError}
                <div class="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm text-red-700">{createError}</p>
                    </div>
                  </div>
                </div>
              {/if}
              <div class="space-y-4">
                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700">Repository Name</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    bind:value={newRepository.name}
                    required
                    pattern="[\w\-]+"
                    title="Repository name can only contain letters, numbers, underscores, and hyphens"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p class="mt-1 text-xs text-gray-500">Only letters, numbers, underscores, and hyphens are allowed</p>
                </div>
                <div>
                  <label for="lionweb_version" class="block text-sm font-medium text-gray-700">LionWeb Version</label>
                  <select
                    id="lionweb_version"
                    name="lionweb_version"
                    bind:value={newRepository.lionweb_version}
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="2023.1">2023.1</option>
                    <option value="2024.1">2024.1</option>
                  </select>
                </div>
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="history"
                    name="history"
                    bind:checked={newRepository.history}
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label for="history" class="ml-2 block text-sm text-gray-900">Enable History Support</label>
                </div>
              </div>
              <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="submit"
                  class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                >
                  Create
                </button>
                <button
                  type="button"
                  on:click={() => showCreateModal = false}
                  class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
  <div class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <div class="sm:flex sm:items-start">
          <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">Delete Repository</h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500">
                Are you sure you want to delete the repository "{repositoryToDelete?.repository_name}"? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            on:click={handleDeleteRepository}
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Delete
          </button>
          <button
            type="button"
            on:click={() => {
              repositoryToDelete = null;
              showDeleteConfirm = false;
            }}
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if} 