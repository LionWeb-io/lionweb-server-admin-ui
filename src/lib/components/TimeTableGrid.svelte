<script lang="ts">
	import MonitorMessageView from '$lib/components/MonitorMessageView.svelte';
	import { isFromClient, mmId, Monitor, type MonitorMessage } from '../../deltaclients/monitor.svelte.js';

	const monitor = Monitor.getInstance()
	
	function fromClient(m: MonitorMessage): boolean {
		return isFromClient(m.delta)
	}
</script>


<div class="grid container gap-3 rounded-lg bg-gray-100 p-4" >
	{#each monitor.getClients() as client}
		<div class="rounded bg-yellow-100 p-1 sticky"
		     style:grid-row={1}
				 style:top={0}
		     style:grid-column={monitor.clientToColum.get(client.id)}
		>
			{client.id}
		</div>
	{/each}
	{#each monitor.getMessages() as message}
		{@const commandOrRequest = fromClient(message)}	
			{@const row = monitor.messageToRow.get(mmId(message))}
			{@const color = isFromClient(message.delta) ? "lightblue" : "lightgreen"}
			<div class="rounded bg-green-200 p-1"
					 style:background-color="{color}"
			     style:grid-row={row}
			     style:grid-column={monitor.clientToColum.get(message.clientId)}
			>
				<MonitorMessageView monitorMessage={message}/>
<!--				<DeltaDetails delta={message.delta}/>-->
				<!--{message.delta.messageKind}-->
			</div>
	{/each}

</div>


<style>
    .container {
				width: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 500px));
				grid-auto-flow: row;
        gap: 4px;
    }
</style>
