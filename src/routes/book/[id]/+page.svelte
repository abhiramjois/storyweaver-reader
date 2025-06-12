<script>
	export let data;

	const metadata = data.book.metadata || {};
	const thumbnailPath = metadata.thumbnail || null;

	function openPdf() {
		window.open(data.book.epubPath, '_blank');
	}
</script>

<svelte:head>
	<title>{data.book.title}</title>
</svelte:head>

<div class="w-full mt-3 mx-auto max-w-6xl py-4">
	<div class="flex flex-col md:flex-row w-full">
		<!-- Thumbnail (2/3 Width on Desktop) -->
		<div class="w-full md:w-2/3 flex justify-center items-start">
			{#if thumbnailPath}
				<div class="relative w-full aspect-[3/2] overflow-hidden">
					<img
						src={thumbnailPath}
						alt="Book thumbnail"
						class="absolute h-[155%] w-full object-cover"
						style="top: -2%; left: -2%;"
					/>
				</div>
			{:else}
				<div class="w-full aspect-[3/4] bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
					No thumbnail
				</div>
			{/if}
		</div>
	
		<!-- Metadata (1/3 Width on Desktop) -->
		<div class="w-full md:w-1/3 p-4">
			<h1 class="text-3xl font-bold mb-2">{data.book.title}</h1>

			{#if metadata.author}
				<p class="text-gray-700 mb-2"><strong>Author:</strong> {metadata.author}</p>
			{/if}

			{#if metadata["translated by"]}
				<p class="text-gray-700 mb-2"><strong>Translated by:</strong> {metadata["translated by"]}</p>
			{/if}

			{#if metadata["illustrated by"]}
				<p class="text-gray-700 mb-2"><strong>Illustrated by:</strong> {metadata["illustrated by"]}</p>
			{/if}

			{#if metadata["published by"]}
				<p class="text-gray-700 mb-2"><strong>Published by:</strong> {metadata["published by"]}</p>
			{/if}

			{#if metadata.license}
				<p class="text-gray-700 mb-2"><strong>License:</strong> {metadata.license}</p>
			{/if}

			<!-- {#if metadata["attribution note"]}
				<p class="text-gray-700 mb-2"><strong>Attribution Note:</strong> {metadata["attribution note"]}</p>
			{/if} -->

			<!-- Actions -->
			<div class="flex gap-4 mt-6 flex-col">
				<button
					on:click={openPdf}
					class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
				>
					Read PDF
				</button>

				<a
					href={data.book.epubPath}
					download
					class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-center"
				>
					Download PDF
				</a>
			</div>
		</div>
	</div>
</div>
