<template>
	<v-sheet color="transparent" v-if="!savedFiles.length">
		<v-card text="You have no saved files." />
	</v-sheet>

	<v-sheet color="transparent" v-else>
		<v-row
			v-for="file, num in savedFiles" 
			:key="file"
			dense
			no-gutters
		>
			<v-col>
				<v-card 
					:key="file" 
					:text="file + '-' + num"
					class="mb-1"
					elevation="0"
				></v-card>
			</v-col>
			<v-col cols="auto">
				<v-btn 
					icon="mdi-download" 
					variant="text"
					size="small"
				></v-btn>
			</v-col>
			<v-col cols="auto">
				<v-btn 
					icon="mdi-trash-can" 
					variant="text"
					size="small"
				></v-btn>
			</v-col>
		</v-row>
	</v-sheet>
</template>

<script setup lang="ts">
	import { ref, type Ref } from "vue"

	// type file
	const savedFiles = ref<string[]>([
		"file",
		"file",
		"file",
		"file",
		"file",
		"file",
		"file",
		"file",
		"file",
		"file",
		"file",
	])
</script>