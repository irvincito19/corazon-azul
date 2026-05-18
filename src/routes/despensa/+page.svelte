<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { ArrowLeft, Plus, Trash2, Check, LogOut, ShoppingCart, X } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let newName = $state('');
	let deletingId = $state<number | null>(null);
	let showSuccess = $state(false);

	const pendingItems = $derived(data.items.filter((i) => !i.purchased));
	const purchasedItems = $derived(data.items.filter((i) => i.purchased));

	function handleSuccess() {
		newName = '';
		showSuccess = true;
		setTimeout(() => (showSuccess = false), 2000);
	}

	function toggleItem(id: number, purchased: number) {
		const form = document.querySelector(`#toggle-${id}`) as HTMLFormElement;
		if (form) form.requestSubmit();
	}
</script>

<div class="mx-auto max-w-md pb-24 pt-6 px-4">

	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/" class="text-muted-foreground hover:text-foreground transition-colors">
				<ArrowLeft size={24} />
			</a>
			<div>
				<h1 class="text-xl font-bold">Lista de Despensa</h1>
				<p class="text-xs text-muted-foreground">Lo que necesitas comprar</p>
			</div>
		</div>
		<form method="POST" action="?/logout" use:enhance>
			<Button variant="ghost" size="icon" type="submit">
				<LogOut size={20} />
			</Button>
		</form>
	</div>

	<!-- Add Form -->
	<Card class="mb-6 p-5">
		<form method="POST" action="?/addItem" use:enhance={() => {
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success') handleSuccess();
			};
		}} class="flex gap-2">
			<div class="relative flex-1">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
					<ShoppingCart size={16} />
				</span>
				<Input
					name="name"
					placeholder="Agregar artículo…"
					bind:value={newName}
					class="pl-9"
					required
				/>
			</div>
			<Button type="submit" class="gap-1 flex-shrink-0">
				<Plus size={16} /> Agregar
			</Button>
		</form>
		{#if showSuccess}
			<p class="mt-2 text-center text-xs font-medium text-green-500 flex items-center justify-center gap-1">
				<Check size={14} /> ¡Artículo agregado!
			</p>
		{/if}
	</Card>

	<!-- Pending Items -->
	<h3 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
		Pendientes ({pendingItems.length})
	</h3>
	<div class="space-y-2 mb-8">
		{#each pendingItems as item}
			<Card class="flex items-center justify-between p-3.5">
				<div class="flex items-center gap-3 min-w-0">
					<form method="POST" action="?/togglePurchased" id="toggle-{item.id}" use:enhance={() => {
						return async ({ update }) => {
							await update();
						};
					}}>
						<input type="hidden" name="id" value={item.id} />
						<input type="hidden" name="purchased" value="1" />
						<button
							type="submit"
							class="flex h-6 w-6 items-center justify-center rounded border border-border hover:border-primary transition-colors"
							aria-label="Marcar como comprado"
						></button>
					</form>
					<p class="text-sm font-medium">{item.name}</p>
				</div>
				<div class="flex items-center gap-2 flex-shrink-0">
					<button
						onclick={() => deletingId = item.id}
						class="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded"
						title="Eliminar"
					>
						<Trash2 size={14} />
					</button>
				</div>
			</Card>
		{:else}
			<p class="text-center text-sm text-muted-foreground py-8">Sin artículos pendientes 🛒</p>
		{/each}
	</div>

	<!-- Purchased Items -->
	{#if purchasedItems.length > 0}
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">
				Comprados ({purchasedItems.length})
			</h3>
			<form method="POST" action="?/clearPurchased" use:enhance>
				<Button type="submit" variant="ghost" size="sm" class="text-xs text-muted-foreground hover:text-red-500 gap-1">
					<Trash2 size={12} /> Limpiar
				</Button>
			</form>
		</div>
		<div class="space-y-2">
			{#each purchasedItems as item}
				<Card class="flex items-center justify-between p-3.5 opacity-60">
					<div class="flex items-center gap-3 min-w-0">
						<form method="POST" action="?/togglePurchased" id="toggle-{item.id}" use:enhance={() => {
							return async ({ update }) => {
								await update();
							};
						}}>
							<input type="hidden" name="id" value={item.id} />
							<input type="hidden" name="purchased" value="0" />
							<button
								type="submit"
								class="flex h-6 w-6 items-center justify-center rounded border border-primary bg-primary/20 text-primary"
								aria-label="Desmarcar"
							>
								<Check size={14} />
							</button>
						</form>
						<p class="text-sm font-medium line-through">{item.name}</p>
					</div>
					<div class="flex items-center gap-2 flex-shrink-0">
						<button
							onclick={() => deletingId = item.id}
							class="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded"
							title="Eliminar"
						>
							<Trash2 size={14} />
						</button>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<!-- DELETE CONFIRM MODAL -->
{#if deletingId !== null}
	<div class="fixed inset-0 z-50 flex items-center justify-center px-6">
		<button type="button" aria-label="Cancelar eliminación" class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={() => deletingId = null}></button>
		<div class="relative w-full max-w-xs rounded-2xl bg-background border border-border p-6 space-y-4 shadow-xl">
			<div class="text-center">
				<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
					<Trash2 size={22} />
				</div>
				<h2 class="text-base font-bold">¿Eliminar artículo?</h2>
				<p class="text-xs text-muted-foreground mt-1">Esta acción no se puede deshacer.</p>
			</div>

			<form method="POST" action="?/deleteItem" use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						deletingId = null;
					}
				};
			}}>
				<input type="hidden" name="id" value={deletingId} />
				<div class="flex gap-2">
					<Button variant="outline" class="flex-1" type="button" onclick={() => deletingId = null}>Cancelar</Button>
					<Button type="submit" class="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1">
						<Trash2 size={15} /> Eliminar
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		background-color: #0c0c0e;
	}
</style>
