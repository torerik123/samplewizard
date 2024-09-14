<template>
	<div v-if="user?.paid">
		<v-sheet color="transparent" v-if="!isFetchingFiles && !sortedFiles.length">
			<v-card text="You have no saved files." />
		</v-sheet>

		<v-sheet color="transparent" v-else>

			<!-- Sorting options  -->

			<!-- <v-row>
				<v-col cols="auto">
					<v-radio-group
						v-model="selectedSortOption"
						inline
					>
					<v-radio
						v-for="option in sortOptions"
						:label="option.title"
						:value="option.value"
					></v-radio>
				</v-radio-group>
				</v-col>
			</v-row> -->
			
			<v-row
				v-for="file in sortedFiles" 
				:key="file.name"
				dense
				no-gutters
				align="center"
				class="mb-1"
			>
				<v-col>
					<AudioVisualizer 
						:src="file.url"
						variant="list"
						:title="file.name"
						@delete="deleteFromLibrary(file.name)"
						@download="downloadLibraryFile(file)"
						:isDeletingFile="showDeleteSpinner(file.name)"
					/>
				</v-col>
			</v-row>

			<!-- Load more  -->
			<v-row>
				<v-col>
					<v-btn 
						v-if="showLoadMoreBtn"
						@click="fetchUserFiles"
						text="Load more..."
						block 
						:loading="isFetchingFiles"
					/>
				</v-col>
			</v-row>
		</v-sheet>
	</div>

	<div v-else>
		<LoginOrSignupBtn message="The library feature is only available to premium users."/>
	</div>
</template>

<script setup lang="ts">
import { ref, type Ref, onMounted, computed, watch } from "vue"
import LoginOrSignupBtn from "../components/LoginOrSignupBtn.vue"

// Components
import AudioVisualizer from '../components/AudioVisualizer.vue'
import { useUtils } from "../composables/useUtils"

import { useRootStore } from "../stores/root"
import { storeToRefs } from "pinia"

// Types 
import type { File, SortOptions } from "../types/global"

const { 
	user, 
	files,
	isFetchingFiles,
	showLoadMoreBtn, 
} = storeToRefs(useRootStore())

const { fetchUserFiles } = useRootStore() 

const {
	deleteFile,
} = useUtils()

// Files
const deletingFiles = ref<string[]>([])

const showDeleteSpinner = (filename) => {
	return deletingFiles.value.length ? deletingFiles.value.includes(filename) : false
}

const selectedSortOption = ref<SortOptions>("desc_date")

const sortOptions = ref([{
	title: "Most recent",
	value: "desc_date",
	},
	{
		title: "Name (A - Z)",
		value: "asc_name",
	},
	// {
	// 	title: "Oldest first",
	// 	value: "asc_date",
	// },
])

const sortedFiles = computed(() => {
	return sortFiles(files.value, selectedSortOption.value)
})

const sortFiles = (files: File[], order: SortOptions = "desc_date"): File[] => {
	switch (order.toLowerCase()) {
		case "desc_date":
			// Sort by date descending
			return files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		case "asc_date":
			// Sort by date ascending
			return files.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
		case "asc_name":
			// Sort alphabetically ascending
			return files.sort((a, b) => a.name.localeCompare(b.name))
		case "desc_name":
			// Sort alphabetically descending
			return files.sort((a, b) => b.name.localeCompare(a.name))
		default:
			return files
	}
}

// Download / delete
const downloadLibraryFile = async (file) => {
	chrome.downloads.download({
		url: file.url,
		filename: file.name,
	})
}

const deleteFromLibrary = async (filename: string) => {
	if (!deletingFiles.value.includes(filename)) {
		deletingFiles.value.push(filename)
	}

	deleteFile(filename, user.value.id)

	files.value = files.value.filter(item => item.name !== filename)
	deletingFiles.value.filter(fileToDelete => fileToDelete !== filename)
}
</script>