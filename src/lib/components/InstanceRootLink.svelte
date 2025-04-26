<script>
  import { GlobeAlt } from 'svelte-heros';
  import { goto } from '$app/navigation';

  function handleClick() {
    goto('/repositories');
  }
</script>

<button class="bg-transparent border-0 p-0" on:click={handleClick}>
  <GlobeAlt class="icon cursor-pointer hover:text-indigo-600" />
</button>

<style>
    .icon {
        width: 24px;
        height: 24px;
        color: #4b5563;
    }
</style>
