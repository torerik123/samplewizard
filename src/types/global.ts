import type { Tables } from "./supabasetypes";

export type Email = Tables<"emails">
export type File = Tables<"files">

export interface ExtPayUser {
	email: string
	installedAt: Date
	paid: boolean
	paidAt: Date | null
	trialStartedAt: Date | null
	id?: string
	token?: string
}