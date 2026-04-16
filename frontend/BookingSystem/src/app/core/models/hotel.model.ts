export interface Hotel {
    id: number;
    name: string;
    /** Backend field */
    city: string;
    /** Backward compat with old mock UI */
    location?: string;
    description: string;
}
