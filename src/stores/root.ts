import { defineStore } from "pinia"
import { ref } from "vue"
import { ExtPayUser, File } from "../types/global"
import { createCustomSupabaseClient } from "../../supabase/client"
import { SortOptions } from "../types/global"
import ExtPay from "../../Extpay.js"
import { useAuth } from "../composables/useAuth"


export const useRootStore = defineStore("root", () => {
	const extpay = ExtPay('samplewizard')
	const user = ref<ExtPayUser>(null)
	const files = ref<File[]>([])
	const isFetchingFiles = ref<boolean>(false)
	const currentOffset = ref<number>(0)
	const pageLimit = ref<number>(10)
	const showLoadMoreBtn = ref<boolean>(true)

	async function getUserData() {
		const { getUserId, refreshToken } = useAuth()
		const extpay_user = await extpay.getUser()
		const id = await getUserId(extpay_user.email)
		const token = await refreshToken(extpay_user.email)

		const user = {
			...extpay_user,
			id,
			token,
		}
		
		return user
	}

	async function fetchUserFiles(
		userId: string,
		sortOptions: SortOptions = "desc_date"
	): Promise<File[]> {
		let fetchedFiles = []

		if (!userId) {
			console.error("Missing user id")
			return 
		}

		isFetchingFiles.value = true
		let sortOptionsFetch = {}

		switch (sortOptions) {
			case "asc_date":
				// Sort by date ascending
				sortOptionsFetch = { column: "created_at", order: "asc" }
				break
			case "asc_name":
				// Sort alphabetically ascending
				sortOptionsFetch = { column: "name", order: "asc" }
				break
			case "desc_name":
				// Sort alphabetically descending
				sortOptionsFetch = { column: "name", order: "desc" }
				break
			default:
				// Sort by date descending
				sortOptionsFetch = { column: "created_at", order: "desc" }
				break
		}

		const { data, error } = await createCustomSupabaseClient(user.value.token).storage
			.from("uploaded_files")
			.list(user.value.id, {
				limit: pageLimit.value,
				offset: currentOffset.value,
				sortBy: sortOptionsFetch,
			})

		if (error) {
			console.error("Error fetching files", error)
			isFetchingFiles.value = false
			return fetchedFiles
		}

		if (data.length) {
			// Workaround for placeholder bug - https://github.com/supabase/supabase/issues/9155
			fetchedFiles = data.filter((file) => file.name !== ".emptyFolderPlaceholder")

			// Create urls
			const filenames = fetchedFiles.map(
				(file) => `${user.value.id}/${file.name}`
			)

			const { data: signedUrls, error: signedUrlsError  } = await createCustomSupabaseClient().storage
				.from("uploaded_files")
				.createSignedUrls(filenames, 60)

			if (signedUrlsError) {
				isFetchingFiles.value = false
				console.warn("Could not get URLs")
				return
			}

			if (signedUrls && signedUrls.length) {
				// Add signed URL to files
				signedUrls.map((el, index) => {
					fetchedFiles[index] = {
						...fetchedFiles[index],
						url: el.signedUrl,
					}
				})
			}

			if (fetchedFiles && fetchedFiles.length) {
				// Add new files
				fetchedFiles.map((newFile) => {
					const fileExists = files.value.find(
						(existingFile) => existingFile.name === newFile.name
					)

					if (!fileExists) {
						files.value.push(newFile)
					}
				})
			}

			currentOffset.value = currentOffset.value + pageLimit.value
		}

		isFetchingFiles.value = false

		// Hide load more btn when last file is fetched
		if (data.length < pageLimit.value) {
			showLoadMoreBtn.value = false
		}

		return fetchedFiles
	}
	
	return { 
		user,
		files,
		isFetchingFiles,
		fetchUserFiles,
		getUserData,
		showLoadMoreBtn,
	 }
})

