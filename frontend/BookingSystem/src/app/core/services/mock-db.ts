// Mock DB is no longer used (USE_MOCK_API=false, real DRF backend).
// Kept as an empty stub to avoid breaking any legacy imports.
export const mockDb = {
    bookings: [],
    nextBookingId: () => 1,
};
