<script lang="ts">
    export let language: string;
    export let version: string;
</script>

<div class="language-tag inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
    <span class="language">{language}</span>
    <span class="version">{version}</span>
</div>

<style>
        
    .version {
        padding-left: 0.4rem;
    }

</style> 