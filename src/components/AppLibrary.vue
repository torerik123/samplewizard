<template>
	<div v-if="isLoggedIn">
		<v-sheet color="transparent" v-if="!savedFiles.length">
			<v-card text="You have no saved files." />
		</v-sheet>

		<v-sheet color="transparent" v-else>
			<v-row
				v-for="file, num in userFiles" 
				:key="file"
				dense
				no-gutters
				align="center"
			>
				<v-col>
					<v-card 
						:key="file"
						:title="file.filename"
						:subtitle="file.created_at"
						class="mb-1"
						elevation="0"
						density="compact"
					>
						<template #prepend>
							<v-btn icon="mdi-play" size="small" :color="highlightColor"/>
						</template>
						<template #append>
							<v-row dense no-gutters>
								<v-col cols="auto">
									<v-btn 
										@click="playFile(file.file_url)"
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
										color="grey"
									></v-btn>
								</v-col>
							</v-row>
						</template>
					</v-card>
				</v-col>
			</v-row>
		</v-sheet>
	</div>

	<div v-else>
		<LoginOrSignupBtn message="The library feature is only available to premium users."/>
	</div>
</template>

<script setup lang="ts">
// TODO 
// Get user files
// Loading spinner while getting files

import { ref, type Ref, onMounted } from "vue"
import LoginOrSignupBtn from "../components/LoginOrSignupBtn.vue"
import ExtPay from "../../Extpay.js"
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://pysnzshgeafotwtersgp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c256c2hnZWFmb3R3dGVyc2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzNjIyMDAsImV4cCI6MjA0MDkzODIwMH0.admFCKfM7V3kdwPbnA_3pONoX9hs_eRvuQubrYOfN0Q')

// TODO
// Supabase types 

const extpay = ExtPay('samplewizard')

const highlightColor = ref("#e255a1")

const isLoggedIn = ref<boolean>(false)

// TODO => TS array of Files
const userFiles = ref([])

//TODO: TS type file
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

const fetchUserFiles = async (userEmail: string) => {
	// TODO
		// FIX RLS
		// JWT => EMAIL

		const { data, error } = await supabase
			.from('email')
			.select(`
				files ( * )
			`)

	if (error) {
		console.error('Error fetching files:', error)
		return []
	}

	return data[0]?.files.length ? data[0].files : []
}


onMounted( async () : Promise<void> => {
	const authUser = await extpay.getUser()

	if (authUser?.paid) {	
		isLoggedIn.value = true

		const files = await fetchUserFiles(authUser.email)
		userFiles.value = files
		console.log("files -- ", files)
	}
})

const playFile = (file) => {
	console.log("TODO")
}
</script>