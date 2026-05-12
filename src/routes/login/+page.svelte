<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { Wallet } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card class="w-full max-w-md p-8">
		<div class="mb-8 flex flex-col items-center">
			<div class="mb-4 rounded-full bg-primary/10 p-3 text-primary">
				<Wallet size={32} />
			</div>
			<p class="text-xs font-bold uppercase tracking-widest text-primary">Corazón Azul</p>
			<h1 class="text-2xl font-bold">Finanzas personales</h1>
			<p class="text-sm text-muted-foreground">Ingresa como irving o viridiana</p>
		</div>

		<form method="POST" use:enhance class="space-y-4">
			<div class="space-y-2">
				<label for="username" class="text-sm font-medium">Usuario</label>
				<Input id="username" name="username" placeholder="Tu nombre" required />
			</div>
			<div class="space-y-2">
				<label for="password" class="text-sm font-medium">Contraseña</label>
				<Input id="password" name="password" type="password" placeholder="••••••••" required />
			</div>

			{#if form?.message}
				<p class="text-center text-sm text-red-500">{form.message}</p>
			{/if}

			<Button type="submit" class="w-full">Entrar</Button>
		</form>
	</Card>
</div>
