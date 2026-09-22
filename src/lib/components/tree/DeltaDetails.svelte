<script lang="ts">
    import TreeView from "$lib/components/tree/TreeView.svelte"
    import type { TreeNodeData } from "$lib/components/tree/TreeNodeData.js"
    import type { MessageFromClient, MessageToClient } from '@lionweb/server-delta-shared';
    import { deltaEventToTreeNodeData } from "./Delta2TreeTransformer.js"

    const { delta }: { delta: MessageFromClient | MessageToClient } = $props();
    
    let treeData: TreeNodeData | undefined = $derived(deltaEventToTreeNodeData(delta))
    let showDeltaTree = $state(false)

    function toggleDeltaTree() {
        showDeltaTree = !showDeltaTree
    }
</script>

<div class="space-y-2 overflow-x-auto text-light-base-900 dark:text-dark-base-100">
    <div class="inline-block min-w-max">
            <div>
                <!-- Debug toggle -->
                <div class="mt-2">
                    <button
                        type="button"
                        class="px-3 py-1.5 rounded bg-light-base-200 hover:bg-light-base-300 dark:bg-dark-base-700 dark:hover:bg-dark-base-600"
                        aria-expanded={showDeltaTree}
                        onclick={toggleDeltaTree}
                    >
                        {delta?.messageKind}
                        <!--{showDeltaTree ? "Hide delta details" : "Show delta details"}-->
                    </button>

                <!-- Tree view -->
                {#if showDeltaTree}
                    <div class="mt-2 bg-light-base-100 dark:bg-dark-base-800 p-2 rounded">
                        {#if treeData}
                            <TreeView dataList={treeData.children} title={treeData.name} />
                        {:else}
                            <div class="text-sm opacity-70">No delta details available</div>
                        {/if}
                    </div>
                {/if}
                </div>
            </div>
    </div>
</div>
