<template>
	<v-sheet color="transparent">
		<v-btn 
			text="Manage subscription"
			class="rounded-lg"
			@click="manageSubscription"
			block
			size="large"
		/>
	</v-sheet>
</template>

<script setup lang="ts">

const manageSubscription = () => {
	chrome.runtime.sendMessage({
		type: "manage-subscription"
	})
}
</script>