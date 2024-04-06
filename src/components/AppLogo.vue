<template>
	<h1 
		class="logo"
		:style="`color: ${color};`"
		data-test="appLogo"
	>
		{{ text }}
	</h1>
</template>

<script setup>
const props = defineProps({
	text: {
		type: String,
		default: ''
	},
	color: {
		type: String,
		default: ''
	},
})

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Aladin&display=swap');

.logo {
	font-family: "Aladin", system-ui;
	font-weight: 400;
	font-style: normal;
}
</style>