<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import { ArrowLeft, Plus, Trash2, RefreshCw, Calendar, Pencil, X, Check, LogOut } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	const categories = [
		'comida', 'transporte', 'casa', 'servicios',
		'entretenimiento', 'salud', 'compras', 'otros'
	];
	const colorOptions = [
		'#3b82f6',
		'#22c55e',
		'#f97316',
		'#eab308',
		'#ec4899',
		'#a855f7',
		'#14b8a6',
		'#ef4444'
	];

	let deletingId = $state<number | null>(null);
	let editingItem = $state<{ id: number; name: string; amount: number; category: string; day: number; color: string } | null>(null);
	let selectedColor = $state(colorOptions[0]);
	let editName = $state('');
	let editAmount = $state('');
	let editCategory = $state('');
	let editDay = $state('');
	let editColor = $state(colorOptions[0]);
	let showSuccess = $state(false);

	function formatCurrency(n: number) {
		return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function openEdit(item: typeof data.items[0]) {
		editingItem = { id: item.id, name: item.name, amount: item.amount, category: item.category, day: item.day, color: item.color };
		editName = item.name;
		editAmount = String(item.amount);
		editCategory = item.category;
		editDay = String(item.day);
		editColor = item.color;
	}

	function closeEdit() {
		editingItem = null;
	}

	const totalRecurring = $derived(data.items.reduce((s, i) => s + i.amount, 0));
</script>

<div class="mx-auto max-w-md pb-24 pt-6 px-4">

	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/" class="text-muted-foreground hover:text-foreground transition-colors">
				<ArrowLeft size={24} />
			</a>
			<div>
				<h1 class="text-xl font-bold">Gastos Recurrentes</h1>
				<p class="text-xs text-muted-foreground">Fijos que se repiten cada periodo</p>
			</div>
		</div>
		<form method="POST" action="?/logout" use:enhance>
			<Button variant="ghost" size="icon" type="submit">
				<LogOut size={20} />
			</Button>
		</form>
	</div>

	<!-- Total recurrentes -->
	{#if data.items.length > 0}
		<Card class="mb-6 p-4 bg-primary/10 border-primary/20">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total comprometido</p>
					<p class="text-2xl font-black text-primary mt-0.5">{formatCurrency(totalRecurring)}</p>
					<p class="text-[10px] text-muted-foreground mt-0.5">pendiente de registrar cuando toque pagarlo</p>
				</div>
				<Calendar size={36} class="text-primary/30" />
			</div>
		</Card>
	{/if}

	<Card class="mb-6 p-4 border-primary/20 bg-primary/5">
	<p class="text-xs leading-relaxed text-muted-foreground">
		Los recurrentes son recordatorios de gastos fijos. Te ayudan a no olvidar pagos del mes, pero no descuentan presupuesto hasta usar <span class="font-semibold text-foreground">Registrar en el mes</span>.
	</p>
	</Card>

	<!-- Add New -->
	<h3 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Agregar Recurrente</h3>
	<Card class="mb-6 p-5">
		<form method="POST" action="?/add" use:enhance={() => {
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success') {
					showSuccess = true;
					setTimeout(() => showSuccess = false, 2000);
				}
			};
		}} class="space-y-3">
			<Input name="name" placeholder="Nombre (ej. Renta, Netflix, Gas)" required />
			<div class="flex gap-2">
				<div class="relative flex-1">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
					<Input name="amount" type="number" step="0.01" placeholder="Monto" class="pl-7" required />
				</div>
				<Input name="day" type="number" min="1" max="31" placeholder="Día" class="w-24" required />
			</div>
			<select
				name="category"
				class="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			>
				{#each categories as cat}
					<option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
				{/each}
			</select>
			<div class="space-y-2">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Color</p>
				<div class="grid grid-cols-8 gap-2">
					{#each colorOptions as color}
						<label class="relative flex aspect-square cursor-pointer items-center justify-center rounded-md border border-border" style="background-color: {color}22;">
							<input class="sr-only" type="radio" name="color" value={color} bind:group={selectedColor} />
							<span class="h-5 w-5 rounded-full ring-offset-2 ring-offset-background" class:ring-2={selectedColor === color} style="background-color: {color}; --tw-ring-color: {color};"></span>
						</label>
					{/each}
				</div>
			</div>
			<Button type="submit" class="w-full gap-2">
				<Plus size={16} /> Agregar
			</Button>
			{#if showSuccess}
				<p class="text-center text-xs text-green-500 font-medium">¡Recurrente guardado!</p>
			{/if}
			{#if form?.message}
				<p class="text-center text-xs text-red-500 font-medium">{form.message}</p>
			{/if}
		</form>
	</Card>

	<!-- List -->
	<h3 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Mis Recurrentes</h3>
	<div class="space-y-2">
		{#each data.items as item}
			<Card class="p-4" style="border-color: {item.color}33; background: linear-gradient(90deg, {item.color}14, transparent 42%), var(--color-card);">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="rounded-full p-2" style="background-color: {item.color}22; color: {item.color};">
							<CategoryIcon category={item.category} size={16} />
						</div>
						<div>
							<p class="text-sm font-bold">{item.name}</p>
							<p class="text-[10px] text-muted-foreground">
								Día {item.day} de cada mes · {item.payer}
							</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<p class="text-sm font-black" style="color: {item.color};">{formatCurrency(item.amount)}</p>
						<button onclick={() => openEdit(item)} class="text-muted-foreground hover:text-foreground transition-colors p-1" title="Editar recurrente">
							<Pencil size={15} />
						</button>
						<button onclick={() => deletingId = item.id} class="text-muted-foreground hover:text-red-500 transition-colors p-1" title="Eliminar recurrente">
							<Trash2 size={15} />
						</button>
					</div>
				</div>

				<!-- Apply button -->
				<form method="POST" action="?/applyRecurring" use:enhance={() => {
					return async ({ update }) => {
						await update();
					};
				}} class="mt-3 border-t border-border pt-3">
					<input type="hidden" name="id" value={item.id} />
					<button
						type="submit"
						disabled={item.appliedThisMonth}
						class="w-full flex items-center justify-center gap-2 rounded-lg text-xs font-semibold py-2 transition-all active:scale-98 disabled:cursor-not-allowed disabled:opacity-55"
						style="background-color: {item.appliedThisMonth ? '#27272a' : item.color + '18'}; color: {item.appliedThisMonth ? '#a1a1aa' : item.color};"
					>
						{#if item.appliedThisMonth}
							<Check size={13} />
							Ya registrado este mes
						{:else}
							<RefreshCw size={13} />
							Registrar en el mes
						{/if}
					</button>
				</form>
			</Card>
		{:else}
			<p class="text-center text-sm text-muted-foreground py-10">
				Sin recurrentes. Agrega aquí renta, servicios o suscripciones.
			</p>
		{/each}
	</div>

	{#if data.items.length > 0}
		<p class="mt-6 text-center text-[10px] text-muted-foreground/50 leading-relaxed px-4">
			Editar un recurrente solo cambia el recordatorio. Los gastos ya registrados se quedan igual.
		</p>
	{/if}
</div>

<!-- EDIT MODAL -->
{#if editingItem}
	<div class="fixed inset-0 z-50 flex items-end justify-center">
		<button type="button" aria-label="Cerrar edición" class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={closeEdit}></button>
		<div class="relative w-full max-w-md rounded-t-2xl bg-background border-t border-border p-6 space-y-4 animate-slideup">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-bold">Editar recurrente</h2>
				<button onclick={closeEdit} class="text-muted-foreground hover:text-foreground"><X size={20} /></button>
			</div>

			<form method="POST" action="?/edit" use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						closeEdit();
						invalidateAll();
					}
				};
			}} class="space-y-3">
				<input type="hidden" name="id" value={editingItem.id} />
				<Input name="name" bind:value={editName} placeholder="Nombre" required />
				<div class="flex gap-2">
					<div class="relative flex-1">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
						<Input name="amount" type="number" step="0.01" bind:value={editAmount} class="pl-7" required />
					</div>
					<Input name="day" type="number" min="1" max="31" bind:value={editDay} class="w-24" required />
				</div>
				<select
					name="category"
					bind:value={editCategory}
					class="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				>
					{#each categories as cat}
						<option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
					{/each}
				</select>
				<div class="space-y-2">
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Color</p>
					<div class="grid grid-cols-8 gap-2">
						{#each colorOptions as color}
							<label class="relative flex aspect-square cursor-pointer items-center justify-center rounded-md border border-border" style="background-color: {color}22;">
								<input class="sr-only" type="radio" name="color" value={color} bind:group={editColor} />
								<span class="h-5 w-5 rounded-full ring-offset-2 ring-offset-background" class:ring-2={editColor === color} style="background-color: {color}; --tw-ring-color: {color};"></span>
							</label>
						{/each}
					</div>
				</div>
				<div class="flex gap-2 pt-1">
					<Button variant="outline" class="flex-1" type="button" onclick={closeEdit}>Cancelar</Button>
					<Button type="submit" class="flex-1 gap-1"><Check size={16} /> Guardar</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- DELETE CONFIRM -->
{#if deletingId !== null}
	<div class="fixed inset-0 z-50 flex items-center justify-center px-6">
		<button type="button" aria-label="Cancelar eliminación" class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={() => deletingId = null}></button>
		<div class="relative w-full max-w-xs rounded-2xl bg-background border border-border p-6 space-y-4 shadow-xl">
			<div class="text-center">
				<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
					<Trash2 size={22} />
				</div>
				<h2 class="text-base font-bold">¿Eliminar recurrente?</h2>
				<p class="text-xs text-muted-foreground mt-1">No afectará los gastos ya registrados.</p>
			</div>

			<form method="POST" action="?/delete" use:enhance={() => {
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

	@keyframes slideup {
		from { transform: translateY(100%); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	.animate-slideup {
		animation: slideup 0.25s ease-out;
	}
</style>
