<script>
	export let data;

	let searchQuery = '';
	let filteredBooks = data.books;

	// Search function
	$: filteredBooks = data.books.filter(book => {
		const title = book.title?.toLowerCase() || '';
		const author = book.metadata.author?.toLowerCase() || '';
		const illustrator = book.metadata['illustrated by']?.toLowerCase() || '';
		const query = searchQuery.toLowerCase();

		return title.includes(query) || author.includes(query) || illustrator.includes(query);
	});
</script>

<svelte:head>
	<title>Pratham Books</title>
</svelte:head>

<!-- Main Container -->
<div class="w-full min-h-screen bg-orange-50">
	<!-- Search Bar -->
	<div class="max-w-7xl mx-auto px-4 py-6">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search by title, author, or illustrator..."
			class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-amber-300"
		/>
	</div>

	<!-- Book Grid Section -->
	<div class="max-w-7xl mx-auto px-4 flex-1">
		{#if filteredBooks.length === 0}
			<div class="text-center py-12">
				<div class="text-6xl mb-4">📚</div>
				<h2 class="text-2xl font-semibold text-gray-600 mb-2">No books found</h2>
				<p class="text-gray-500">Try a different search query.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 justify-items-center">
				{#each filteredBooks as book}
					<div class="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full overflow-hidden w-full">
						<a href="/book/{book.id}">
							{#if book.thumbnailPath}
								<div class="w-full h-48 overflow-hidden relative">
									<img
										src={book.thumbnailPath}
										alt={book.title}
										class="absolute top-0 left-0 h-[170%] object-cover object-top w-full"
										style="top: -2%;"
									/>
								</div>
							{:else}
								<div class="h-64 bg-gray-200 flex items-center justify-center text-2xl text-gray-600">
									No Thumbnail
								</div>
							{/if}										
						</a>
					
						<div class="p-4 flex flex-col flex-1">
							<h3 class="font-semibold text-lg mb-2 text-gray-800 line-clamp-2">{book.title}</h3>
							{#if book.metadata.author}
								<p class="text-gray-600 text-sm mb-1">By {book.metadata.author}</p>
							{/if}
							{#if book.metadata['illustrated by']}
								<p class="text-gray-600 text-sm mb-6">Illustrated by {book.metadata['illustrated by']}</p>
							{/if}
							<a
								href="/book/{book.id}"
								class="inline-block w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg text-center transition-colors duration-200 mt-auto"
							>
								View Book
							</a>
						</div>
					</div>			
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
