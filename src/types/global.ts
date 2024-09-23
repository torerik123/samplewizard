import type { Tables } from "./supabasetypes";

// User data 
export interface ExtPayUser {
	email: string
	installedAt: Date
	paid: boolean
	paidAt: Date | null
	trialStartedAt: Date | null
	id?: string
	token?: string
	settings?: UserSettings
}

export interface UserSettings {
	tabIsDefaultSampleName?: boolean
	mutePlayingTab?: boolean
	trimSilence?: boolean
}

export type EmailRow = Tables<"emails">

// Files 
export interface File {
	created_at: string
	id: string
	last_accessed_at: string
	metadata?: FileMetaData
	name: string
	updated_at: string
	url: string
}

export interface FileMetaData {
	cacheControl: string
	contentLength : number
	eTag : string 
	httpStatusCode: number
	lastModified: string
	mimetype: string
	size: number
}

export type SortOptions = "asc_date" | "desc_date" | "asc_name" | "desc_name"

export interface AudioFormatOption {
	title: string
	value: string
	props?: { 
		disabled?: boolean 
	}
}