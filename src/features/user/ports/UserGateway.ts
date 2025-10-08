/**
 * User Gateway Interface
 * Defines the contract for user profile operations
 */

export interface CreateProfileInput {
	id: string;
	pseudo: string;
	income: number;
	currency: string;
	shareRevenue: boolean;
}

export interface ProfileData {
	id: string;
	pseudo: string;
	income: number;
	shareRevenue: boolean;
	currency: string;
	createdAt: string;
}

export interface UpdateProfileInput {
	pseudo?: string;
	income?: number;
	shareRevenue?: boolean;
}

export interface UserGateway {
	/**
	 * Create a new user profile
	 */
	createProfile(input: CreateProfileInput): Promise<void>;

	/**
	 * Get profile by user ID
	 * Returns null if not found or soft-deleted
	 */
	getProfileById(id: string): Promise<ProfileData | null>;

	/**
	 * Update user profile
	 */
	updateProfile(id: string, patch: UpdateProfileInput): Promise<void>;
}
