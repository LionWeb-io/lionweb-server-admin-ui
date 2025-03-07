<script lang="ts">
  import { onMount } from 'svelte';
</script>

<div class="bg-white shadow rounded-lg p-6">
  <div class="text-center">
    <h1 class="text-3xl font-bold text-gray-900 mb-4">Welcome to LionWeb Repository Admin</h1>
    <p class="text-xl text-gray-600 mb-8">Manage and explore your LionWeb repositories</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
    <div class="bg-gray-50 p-6 rounded-lg">
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Repository Management</h2>
      <p class="text-gray-600">Create and manage your LionWeb repositories with an intuitive interface.</p>
    </div>

    <div class="bg-gray-50 p-6 rounded-lg">
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Data Exploration</h2>
      <p class="text-gray-600">Browse and explore the contents of your repositories efficiently.</p>
    </div>
  </div>

  <div class="mt-8 text-center">
    <a
      href="/repositories"
      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Manage Repositories
    </a>
  </div>
</div>
