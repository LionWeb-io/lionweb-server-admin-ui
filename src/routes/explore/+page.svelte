<script lang="ts">
  import { onMount } from 'svelte';
  import type { Partition } from '$lib/types';
  import type { SerializationChunk } from '@lionweb/core';
  import { getPartitions, createPartition } from '$lib/services/repository';
  import { currentSerializationFormatVersion } from '@lionweb/core';

  let repositoryName = 'default';
  let partitions: Partition[] = [];
  let loading = false;
  let error: string | null = null;
  let showCreateModal = false;
  let newPartition: SerializationChunk = {
    serializationFormatVersion: currentSerializationFormatVersion,
    languages: [],
    nodes: []
  };

  async function loadPartitions() {
    if (!repositoryName) return;
    
    loading = true;
    error = null;
    
    try {
      const response = await getPartitions(repositoryName);
      console.log('Partition list response:', response);
      partitions = response.partitions;
      console.log('Updated partitions array:', partitions);
    } catch (e) {
      error = `Failed to load partitions: ${e instanceof Error ? e.message : 'Unknown error'}`;
      console.error('Error details:', e);
    } finally {
      loading = false;
    }
  }

  async function handleCreatePartition() {
    try {
      await createPartition(repositoryName, newPartition);
      showCreateModal = false;
      await loadPartitions(); // Reload the list
      newPartition = {
        serializationFormatVersion: currentSerializationFormatVersion,
        languages: [],
        nodes: []
      };
    } catch (e) {
      error = `Failed to create partition: ${e instanceof Error ? e.message : 'Unknown error'}`;
      console.error('Error details:', e);
    }
  }

  function addLanguage() {
    newPartition.languages = [...newPartition.languages, { key: '', version: '' }];
  }

  function removeLanguage(index: number) {
    newPartition.languages = newPartition.languages.filter((_, i) => i !== index);
  }

  function addNode() {
    newPartition.nodes = [...newPartition.nodes, {
      id: '',
      classifier: { language: '', version: '', key: '' },
      properties: [],
      containments: [],
      references: [],
      annotations: [],
      parent: null
    }];
  }

  function removeNode(index: number) {
    newPartition.nodes = newPartition.nodes.filter((_, i) => i !== index);
  }

  onMount(() => {
    loadPartitions();
  });
</script>

<div class="bg-white shadow rounded-lg">
  <div class="px-4 py-5 sm:p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Explore Repository</h2>
      <button
        on:click={() => showCreateModal = true}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Create Partition
      </button>
    </div>

    <div class="mb-6">
      <label for="repository-name" class="block text-sm font-medium text-gray-700">Repository Name</label>
      <div class="mt-1 flex rounded-md shadow-sm">
        <input
          type="text"
          id="repository-name"
          bind:value={repositoryName}
          class="flex-1 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter repository name"
        />
        <button
          on:click={loadPartitions}
          class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Load Partitions
        </button>
      </div>
    </div>

    {#if loading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    {:else if error}
      <div class="text-center py-12">
        <p class="text-red-600">{error}</p>
        <p class="text-sm text-gray-500 mt-2">Please check if the repository name is correct and the server is running at {import.meta.env.VITE_API_BASE_URL}</p>
      </div>
    {:else if partitions.length === 0}
      <div class="text-center py-12">
        <p class="text-gray-500">No partitions found in repository "{repositoryName}"</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nodes</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each partitions as partition}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{partition.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{partition.nodeCount}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{new Date(partition.createdAt).toLocaleString()}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{new Date(partition.updatedAt).toLocaleString()}</div>
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
    <div class="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Partition</h3>
      <form on:submit|preventDefault={handleCreatePartition}>
        <div class="space-y-6">
          <div>
            <label for="version" class="block text-sm font-medium text-gray-700">Serialization Format Version</label>
            <input
              type="text"
              id="version"
              bind:value={newPartition.serializationFormatVersion}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">Languages</label>
              <button
                type="button"
                on:click={addLanguage}
                class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Language
              </button>
            </div>
            <div class="space-y-4">
              {#each newPartition.languages as language, index}
                <div class="flex gap-4 items-start">
                  <div class="flex-1">
                    <input
                      type="text"
                      bind:value={language.key}
                      placeholder="Language key"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div class="flex-1">
                    <input
                      type="text"
                      bind:value={language.version}
                      placeholder="Version"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    on:click={() => removeLanguage(index)}
                    class="inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">Nodes</label>
              <button
                type="button"
                on:click={addNode}
                class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Node
              </button>
            </div>
            <div class="space-y-4">
              {#each newPartition.nodes as node, index}
                <div class="border rounded-lg p-4">
                  <div class="flex justify-between items-center mb-4">
                    <h4 class="text-sm font-medium text-gray-900">Node {index + 1}</h4>
                    <button
                      type="button"
                      on:click={() => removeNode(index)}
                      class="inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">ID</label>
                      <input
                        type="text"
                        bind:value={node.id}
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Classifier Language</label>
                      <input
                        type="text"
                        bind:value={node.classifier.language}
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Classifier Version</label>
                      <input
                        type="text"
                        bind:value={node.classifier.version}
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Classifier Key</label>
                      <input
                        type="text"
                        bind:value={node.classifier.key}
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              {/each}
            </div>
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
            Create Partition
          </button>
        </div>
      </form>
    </div>
  </div>
{/if} 