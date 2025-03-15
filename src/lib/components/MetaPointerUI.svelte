<script lang="ts">
    export let language: string;
    export let key: string;
    export let version: string;
</script>

<div class="meta-pointer">
    <div class="metadata">
        <span class="language">{language}</span>
        <span class="version">{version}</span>
    </div>
    <div class="key">{key}</div>
</div>

<style>
    .meta-pointer {
        display: inline-flex;
        flex-direction: column;
        gap: 0.0rem;
        /*padding: 0.35rem 0.45rem;*/
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #f9f9f9;
        font-family: system-ui, -apple-system, sans-serif;
    }

    .metadata {
        display: flex;
        justify-content: space-between;
        padding: 0.1rem 0.25rem;
        font-size: 0.65rem;
        color: #666;

        border-bottom: 1px solid #ccc;
        border-radius: 6px;
        /*background-color: #f9f9f9;*/
    }

    .language, .version {
        display: inline-block;        
    }

    .key {
        color: #333;
        font-size: 1rem;
        font-weight: 300;
        padding: 0.15rem 0.25rem;
    }
</style> 