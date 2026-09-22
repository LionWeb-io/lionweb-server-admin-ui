<script lang="ts">
    import TreeView from "./TreeView.svelte"
    import { type TreeNodeProps } from '$lib/components/tree/TreeNodeData.js';
    import { ArrowDown01, ArrowUpRight, SquareArrowRightExit } from "@lucide/svelte"

    let { data }: TreeNodeProps = $props();

    // State to track expansion
    let expanded: boolean = $state(false);

    function toggle() {
        expanded = !expanded;
    }
</script>

<li class="freon-infopanel-tree-node">
    <div class="freon-infopanel-tree-row">
        <button
            onclick={toggle}
            tabindex="0"
            class="freon-infopanel-tree-toggle"
        >
            {#if data.children}
                {#if expanded}
                    <ArrowDown01 />
                {:else}
                    <ArrowUpRight  />
                {/if}
                <span>5 {data.name}</span>
            {:else}
                <span class="freon-infopanel-tree-leaf">{data.name}</span>s
            {/if}
        </button>
    </div>

    {#if expanded && data.children}
        <TreeView dataList={data.children} />
    {/if}
</li>
