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
import ExtPay from "../../Extpay.js"
import { supabase } from "../supabase";

// Components
import AudioVisualizer from '../components/AudioVisualizer.vue';
import { useUtils } from "../composables/useUtils";

// Types 
import { type ExtPayUser } from '../types/global';
import type { File } from "../types/global";

// TODO
// JWT AUTH
// Loading spinner getting files + deleting
// Get storage bucket types
// Fetch initial files in background

const extpay = ExtPay('samplewizard')
const user = ref<ExtPayUser>()

const {
	refreshToken, 
	getUserId,
	deleteFile,
} = useUtils()

// Files
const deletingFiles = ref<string[]>([])

const showDeleteSpinner = (filename) => {
	return deletingFiles.value.length ? deletingFiles.value.includes(filename) : false
}

type SortOptions = "asc_date" | "desc_date" | "asc_name" | "desc_name"

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

const userFiles = ref<File[]>([])
const isFetchingFiles = ref(false)
const currentOffset = ref(0)
const pageLimit = ref(10)
const showLoadMoreBtn = ref(true)

const fetchUserFiles = async () : Promise<File[]> => {
	isFetchingFiles.value = true
	let sortOptionsFetch = {}

	switch (selectedSortOption.value) {
		case "desc_date":
			// Sort by date descending
			sortOptionsFetch = { column: 'created_at', order: 'desc' }
			break
		case "asc_date":
			// Sort by date ascending
			sortOptionsFetch = { column: 'created_at', order: 'asc' }
			break
		case "asc_name":
			// Sort alphabetically ascending
			sortOptionsFetch = { column: 'name', order: 'asc' }
			break
		case "desc_name":
			// Sort alphabetically descending
			sortOptionsFetch = { column: 'name', order: 'desc' }
			break
		default:
			break
	}
// TODO
	// Fix Array return type
	// Move to useUtils 
	// JWT => EMAIL

	let files = []

	const { data, error } = await supabase
		.storage
		.from('uploaded_files')
		.list(user.value.id, {
			limit: pageLimit .value,
			offset: currentOffset.value,
			sortBy: sortOptionsFetch,
		})

	if (error) {
		console.error("Error fetching files", error)
	}

	if (data.length) {
		// Workaround for placeholder bug - https://github.com/supabase/supabase/issues/9155
		files = data.filter(file => file.name != ".emptyFolderPlaceholder" ? file : false)

		// Create urls
		const filenames = files.map(file =>  `${user.value.id}/${file.name}`)

		const { data: signedUrls, error } = await supabase
			.storage
			.from('uploaded_files')
			.createSignedUrls(filenames, 60)

			if (error) {
				isFetchingFiles.value = false
				console.warn("Could not get URLs")
				return
			}

			if (signedUrls.length) {
				// Add signed URL to files
				signedUrls.map((el, index) => {
					files[index] = {
						...files[index],
						url: el.signedUrl
					}
				})
			}

			if (files && files.length) {
				// Add new files
				files.map(newFile => { 
					const fileExists = userFiles.value.find(existingFile => existingFile.name === newFile.name)

					if (!fileExists) {
						userFiles.value.push(newFile)
					}
				})
			}

			currentOffset.value = currentOffset.value + pageLimit.value
	}

	// Hide load more btn when last file is fetched 
	if (data.length < pageLimit.value) {
		showLoadMoreBtn.value = false
	}

	isFetchingFiles.value = false
	return files
}

const sortedFiles = computed(() => {
	return sortFiles(userFiles.value, selectedSortOption.value)
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

	userFiles.value = userFiles.value.filter(item => item.name !== filename)
	deletingFiles.value.filter(fileToDelete => fileToDelete !== filename)
}


onMounted( async () : Promise<void> => {
	user.value = await extpay.getUser()

	if (user.value?.paid) {	
		user.value.id = await getUserId(user.value.email)
		user.value.token = await refreshToken(user.value.email)
		await fetchUserFiles()
	}
})
</script>