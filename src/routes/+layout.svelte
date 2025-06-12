<script>
	import "../app.css";
</script>

<svelte:head>
	<title>ಪ್ರಥಮ್ ಪುಸ್ತಕಗಳು</title>
</svelte:head>

<div class="min-h-screen bg-orange-50 flex flex-col">
	<!-- Banner with background image and centered title -->
	<header
		class="relative h-32 bg-cover bg-center text-white flex items-center justify-center"
		style="background-image: url('/banner.jpg');"
	>
		<!-- Amber overlay -->
		<div class="absolute inset-0 bg-pink-700 opacity-60"></div>

		<!-- Title -->
		<h1 class="relative z-10 text-2xl md:text-5xl font-bold text-center">
			ಪ್ರಥಮ್ ಪುಸ್ತಕಗಳು
		</h1>
	</header>

	<!-- Main page content -->
	<main class="flex-1 pb-8">
		<slot />
	</main>
</div>
