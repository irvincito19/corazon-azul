<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="min-h-screen bg-background text-foreground selection:bg-primary/30">
	{@render children()}
</div>
