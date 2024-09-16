import { supabase } from "../../supabase/client"
import { parseJwt } from "../../supabase/functions/sign-jwt/jwt.js"

export const useAuth = () => { 
	const getUserId = async (email: string): Promise<string> => {
		try {
			let {
				data: { user_id },
			} = await supabase
				.from("emails")
				.select("user_id")
				.eq("user_email", email)
				.single()
	
			if (!user_id) {
				console.warn("User not found.")
				return user_id
			}
			return user_id
		} catch (error) {
			console.error("Failed to get user ID",error)
		}
	}

	const getJwtToken = async (email: string) => {
		// Get JWT token from supabase edge function
		if (!email) {
			return
		}

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

	const refreshToken = async (email: string) : Promise<string> => {
		if (!email) {
			return 
		}
		
		// Check for existing token => if not => get new token
		let { samplewizard_jwt } = await chrome.storage.local.get([
			"samplewizard_jwt",
		])

		// Check logged in users email matches email in JWT payload
		const decodedToken = parseJwt(samplewizard_jwt)

		if (!samplewizard_jwt || decodedToken.email !== email) {
			console.log("Setting new token.")
			const newToken = await getJwtToken(email)

			await chrome.storage.local.set({ samplewizard_jwt: newToken })
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
