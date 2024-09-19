import { supabase } from "../../supabase/client"
import { parseJwt } from "../../supabase/functions/sign-jwt/jwt.js"
import { UserSettings } from "../types/global"

export const useAuth = () => {
	const getUserId = async (email: string): Promise<{ user_id: string, settings: UserSettings}> => {
		// Get user ID and saved settings
		try {
			let {
				data: userData,
			} = await supabase
				.from("emails")
				.select("user_id, settings")
				.eq("user_email", email)
				.single()
	
			if (!userData) {
				console.warn("User not found.")
				return userData
			}
			return userData
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

		return samplewizard_jwt
	}

	return {
		getJwtToken,
		refreshToken,
		getUserId,
	}
}
