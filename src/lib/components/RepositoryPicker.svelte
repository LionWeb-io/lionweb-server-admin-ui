<script>
	const repositoryName = "Foo Repository";
	const repositories = [
		{
			name: "Foo Repository",
			lionweb_version: "2023.1",
			history: false
		},
		{
			name: "Other Repository",
			lionweb_version: "2024.1",
			history: true
		},
	];
	function handleRepositoryChange() {

	}
	let selected = repositories[0];
	let isOpen = false;

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function selectOption(option) {
		selected = option;
		isOpen = false;
	}
</script>
<div class="custom-select">
	<div class="selected" on:click={toggleDropdown}>
		<div class="option-row">
			<span class="option-title">{selected.name}</span>
			<span class="badge version">{selected.lionweb_version}</span>
			<span class="badge history">{selected.history ? 'History enabled' : 'No history'}</span>
		</div>
		<span class="arrow">{isOpen ? '▲' : '▼'}</span>
	</div>

	{#if isOpen}
		<ul class="options">
			{#each repositories as option}
				<li class="option-row" on:click={() => selectOption(option)}>
					<span class="option-title">{option.name}</span>
						<span class="badge version">{option.lionweb_version}</span>
					<span class="badge history">{option.history ? 'History enabled' : 'No history'}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
    .custom-select {
        position: relative;
        max-width: 400px;
        font-family: sans-serif;
    }

    .selected {
        display: flex;
        align-items: center;
        justify-content: space-between; /* Space between option content and arrow */
        padding: 0 5px;
        /*border: 1px solid #ccc;*/
        background: #fff;
        border-radius: 5px;
        cursor: pointer;
    }

    .option-row {
        display: flex;
        align-items: center;
        gap: 8px; /* spacing between title and badges */
				padding: 5px;
    }

    .arrow {
        font-size: 12px;
        color: #666;
        margin-left: 10px;
    }

    .options {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ccc;
        border-radius: 5px;
        z-index: 1000;
    }

		.options .option-row {
				padding: 15px 10px;
				border-bottom: 1px solid #ccc;
				margin: 0 10px 0 10px;
		}

    .option-row:hover {
        background: #f9f9f9;
    }

    .option-title {
        font-weight: bold;
        margin-bottom: 5px;
				display: inline-block;
    }

    .badge {
        font-size: 14px;
        padding: 6px 10px;
        border-radius: 10px;
        background-color: #f0f0f0;
        display: inline-block;
    }

    .badge.version {
        color: #0070f3;
        background-color: #e6f0ff;
        display: inline-block;
    }

    .badge.history {
        color: #555;
        background-color: #f5f5f5;
        display: inline-block;
    }


</style>
