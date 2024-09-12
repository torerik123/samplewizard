<template>
	<div v-if="user?.paid">
		<v-sheet color="transparent" v-if="!userFiles.length">
			<v-card text="You have no saved files." />
		</v-sheet>

		<v-sheet color="transparent" v-else>
			<v-row
				v-for="file in userFiles" 
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
import { ref, type Ref, onMounted, computed } from "vue"
import LoginOrSignupBtn from "../components/LoginOrSignupBtn.vue"
import ExtPay from "../../Extpay.js"
import { supabase } from "../supabase";

// Components
import AudioVisualizer from '../components/AudioVisualizer.vue';
import { useUtils } from "../composables/useUtils";

// Types 
import { type ExtPayUser } from '../types/global.js';

// TODO
// X - Delete
// Download 
// JWT AUTH
// Loading spinner getting files + deleting
// Get storage bucket types

const extpay = ExtPay('samplewizard')
const user = ref<ExtPayUser>()

const userFiles = ref<File[]>([])
const jwt = ref()
const {
	refreshToken, 
	getUserId,
	deleteFile,
} = useUtils()

const fetchUserFiles = async () : Promise<File[]> => {
// TODO
	// Fix Array return type
	// Move to useUtils 
	// JWT => EMAIL

	let files = []

	const { data, error } = await supabase
		.storage
		.from('uploaded_files')
		.list(user.value.id, {
			limit: 100,
			offset: 0,
			sortBy: { column: 'name', order: 'asc' },
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
				console.warn("Could not get URLs")
				return
			}

			if (signedUrls.length) {
				signedUrls.map((el, index) => {
					files[index] = {
						...files[index],
						url: el.signedUrl
					}
				})
			}
	}
	return files
}

const deleteFromLibrary = async (filename: string) => {
	deleteFile(filename, user.value.id)

	userFiles.value = userFiles.value.filter(item => item.name !== filename)
}

onMounted( async () : Promise<void> => {
	user.value = await extpay.getUser()

	if (user.value?.paid) {	
		user.value.id = await getUserId(user.value.email)
		jwt.value = await refreshToken(user.value.email)
		const files = await fetchUserFiles()
		
		if (files && files.length) {
			userFiles.value = files
		}
	}
})
</script>