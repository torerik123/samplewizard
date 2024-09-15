import { supabase } from "../../supabase/client"

export const useAuth = () => { 
	const getUserId = async (email: string): Promise<string> => {
		// Get UUID
		let {
			data: { user_id },
			error,
		} = await supabase
			.from("emails")
			.select("user_id")
			.eq("user_email", email)
			.single()

		if (error) {
			console.log(error)
		}

		if (!user_id) {
			console.warn("User not found.")
			return ""
		}
		return user_id
	}

	const getJwtToken = async (email: string) => {
		// Get JWT token from supabase edge function
		try {
			const response = await fetch(
				"https://pysnzshgeafotwtersgp.supabase.co/functions/v1/sign-jwt",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${
							import.meta.env.VITE_SUPABASE_ANON_KEY
						}`,
					},
					body: JSON.stringify({ email }),
				}
			)

			if (!response.ok) {
				throw new Error(`Error: ${response.statusText}`)
			}

			const data = await response.json()
			return data.token
		} catch (error) {
			console.error("Failed to get JWT token", error)
			return null
		}
	}

	const refreshToken = async (email: string) => {
		// Check for existing token => if not => get new token

		// TODO => Check if token is valid
		let { samplewizard_jwt } = await chrome.storage.local.get([
			"samplewizard_jwt",
		])

		if (!samplewizard_jwt) {
			const newToken = await getJwtToken(email)

			await chrome.storage.local.set({ samplewizard_jwt: newToken })
			console.log("New token: ", newToken)
			samplewizard_jwt = newToken
		}

		console.log("Received JWT Token:", samplewizard_jwt)

		return samplewizard_jwt
	}

	return {
		getJwtToken,
		refreshToken,
		getUserId,
	}
}
