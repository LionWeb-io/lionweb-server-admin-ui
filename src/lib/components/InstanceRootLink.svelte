<script>
export let onClick = () => {};
</script>

<span class="breadcrumb-root-icon" on:click={onClick} title="Home">
  <!-- Example with inline SVG -->
  <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2L2 9h3v9h4V13h2v5h4V9h3L10 2z" />
  </svg>
</span>

<style>
    .breadcrumb-root-icon {
        cursor: pointer;
        display: flex;
        align-items: center;
        color: white;
				background: #0070f3;
    }

    .breadcrumb-root-icon:hover {
        color: #005bb5;
    }

    .icon {
        width: 24px;
        height: 24px;
    }
</style>
