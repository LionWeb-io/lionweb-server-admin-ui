<script lang="ts">
	import { getType, isPrimitive } from '$lib/components/tree/DeltaProperties.js';
	import DeltaView3 from '$lib/DeltaView3.svelte';
	import type { MessageFromClient, MessageToClient } from '@lionweb/server-delta-shared';
	import type { MonitorMessage } from '../../deltaclients/monitor.svelte.js';
	// provide a visually animated transition for tree node expansion/contraction
	import { slide } from 'svelte/transition';

	let { delta }: { delta: MessageFromClient | MessageToClient } = $props();
	let typeDef = getType(delta)!;

	// let arrowDown       = $derived(expanded);
	// const toggleExpansion = () => expanded = !expanded;
</script>

<ul transition:slide="{{duration:500}}">
		<li class="modal__window">
			<table>
				<tbody>
				{#each typeDef?.properties as prop}
					{#if isPrimitive(prop) }
						<tr>
							<td>{prop.name}:</td>
							<td>{(delta as any)[prop.name]}</td>
						</tr>
					{:else}
						<tr>
							<td>{prop.name}:</td>
							<td>
								{JSON.stringify((delta as any)[prop.name])}
<!--								<DeltaView3 delta={(delta as any)[prop.name]} />-->
							</td>
						</tr>
						
					{/if}
				{/each}
				</tbody>
			</table>
		</li>
</ul>

<style>
		table {
        border-collapse: separate;
        border-spacing: 4px 0;
    }

    .modal__window {
        position: absolute;
        background-color: white;
        padding: 1em 1em;
        /*width: 300px;*/
    }

    ul {
        margin: 0; /* nix default <ul> spacing: 1em, 0 */
        list-style-type: none; /* nix traditional list bullets */
        padding-left: 1.2rem; /* lesser list indendation */
        user-select: none; /* disable selectable text */
    }

    .no-arrow-spacer {
        padding-left: 1.0rem;
    }

    .arrow {
        cursor: pointer;
        display: inline-block;
        transition-duration: 500ms;
        transition-property: transform;
    }

    .arrowDown {
        transform: rotate(90deg);
    }
</style>
