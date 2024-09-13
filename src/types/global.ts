import type { Tables } from "./supabasetypes";

export type Email = Tables<"emails">
// export type File = Tables<"files"> // TODO USE STORAGE TYPES

export interface File {
	created_at: string
	id: string
	last_accessed_at: string
	metadata: FileMetaData
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

export interface ExtPayUser {
	email: string
	installedAt: Date
	paid: boolean
	paidAt: Date | null
	trialStartedAt: Date | null
	id?: string
	token?: string
}