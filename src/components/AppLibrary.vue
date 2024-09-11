<template>
	<div v-if="isLoggedIn">
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
						:src="file.file_url"
						variant="list"
						:title="file.name"
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
import { ref, type Ref, onMounted } from "vue"
import LoginOrSignupBtn from "../components/LoginOrSignupBtn.vue"
import ExtPay from "../../Extpay.js"
import { supabase } from "../supabase";

// Components
import AudioVisualizer from '../components/AudioVisualizer.vue';
import { useUtils } from "../composables/useUtils";

// TODO
// Get files from bucket with name UUID
// Loading spinner while getting files
// Get storage bucket types

const extpay = ExtPay('samplewizard')
const highlightColor = ref("#e255a1")

const isLoggedIn = ref<boolean>(false)

const userFiles = ref<File[]>([])
const jwt = ref()
const { refreshToken, getUserId } = useUtils()

const fetchUserFiles = async (userEmail: string) : Promise<File[]> => {
// TODO
	// Fix Array return type
	// Move to useUtils 
	// JWT => EMAIL

	let files = []
	// Get UUID
	const user_id = await getUserId(userEmail)
	console.log("LIBRARY", user_id)

	const { data, error } = await supabase
		.storage
		.from('uploaded_files')
		.list(user_id, {
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
	}
	return files
}


onMounted( async () : Promise<void> => {
	const authUser = await extpay.getUser()

	if (authUser?.paid) {	
		isLoggedIn.value = true

		jwt.value = await refreshToken(authUser.email)
		const files = await fetchUserFiles(authUser.email)
		
		if (files && files.length) {
			userFiles.value = files
		}
	}
})

const playFile = (fileUrl) => {
	console.log(fileUrl)
}
</script>