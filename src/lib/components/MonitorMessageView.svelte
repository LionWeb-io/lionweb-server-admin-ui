<script lang="ts">
	import DeltaView from '$lib/components/DeltaView.svelte';
	import DeltaView2 from '$lib/components/DeltaView2.svelte';
	import { getType } from '$lib/components/tree/DeltaProperties.js';
	import { getDeltaId, type MonitorMessage } from '../../deltaclients/monitor.svelte.js';
	// provide a visually animated transition for tree node expansion/contraction
	import {slide} from 'svelte/transition';

	let { monitorMessage }: { monitorMessage: MonitorMessage } = $props()
	
	let   expanded       = $state(false);
	let arrowDown       = $derived(expanded);
	const toggleExpansion = () => expanded = !expanded;
</script>

<ul transition:slide="{{duration:500}}">
	<li>
      <div on:click={toggleExpansion} class="overflow-x-hidden text-nowrap">
<!--		    &#x25b6-->
				{monitorMessage.delta.messageKind}
		  </div>
			{#if expanded}
				<DeltaView2 delta={monitorMessage.delta}/>
			{/if}
	</li>
</ul>

<style>
    ul {
        margin:          0;      /* nix default <ul> spacing: 1em, 0 */
        list-style-type: none;   /* nix traditional list bullets */
        padding-left:    1.2rem; /* lesser list indendation */
        user-select:     none;   /* disable selectable text */
    }
    .no-arrow-spacer {
        padding-left:    1.0rem;
    }
    .arrow {
        cursor:              pointer;
        display:             inline-block;
        transition-duration: 500ms;
        transition-property: transform;
    }
    .arrowDown {
        transform: rotate(90deg);
    }
</style>
