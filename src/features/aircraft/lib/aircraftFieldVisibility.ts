/**
 * Mongoose projection applied to every PUBLIC (unauthenticated) aircraft
 * read. These fields are internal: createdBy is an admin's user id and
 * aiNotes is staff guidance for the AI concierge. Admin reads must NOT
 * use this projection.
 */
export const PUBLIC_HIDDEN_AIRCRAFT_FIELDS = "-createdBy -aiNotes";
