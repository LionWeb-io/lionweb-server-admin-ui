<script lang="ts">
	export let language: string;
	export let key: string;
	export let version: string;

	import LanguageUI from '$lib/components/LanguageUI.svelte';
</script>

<div class="meta-pointer">
	<LanguageUI {language} {version} />
	<div class="key">{key}</div>
</div>

<style>
	.meta-pointer {
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.key {
		color: #333;
		font-size: 1rem;
		font-weight: 300;
		padding: 0.15rem 0.25rem;
	}
</style>
