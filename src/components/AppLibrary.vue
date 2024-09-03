<template>
	<div v-if="isLoggedIn">
		<v-sheet color="transparent" v-if="!savedFiles.length">
			<v-card text="You have no saved files." />
		</v-sheet>

		<v-sheet color="transparent" v-else>
			<v-row
				v-for="file, num in savedFiles" 
				:key="file"
				dense
				no-gutters
				align="center"
			>
				<v-col>
					<v-card 
						:key="file"
						:title="file + '-' + num"
						subtitle="01/02/2023 | 00:00"
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
										@click="playFile(file)"
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

const extpay = ExtPay('samplewizard')

const highlightColor = ref("#e255a1")

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

const  isLoggedIn = ref<boolean>(false)

onMounted( async () : Promise<void> => {
	const authUser = await extpay.getUser()

	if (authUser?.paid) {	
		isLoggedIn.value = true
	}
})

const playFile = (file) => {
	console.log("TODO")
}
</script>