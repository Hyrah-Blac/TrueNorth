/**
 * Mongoose projection applied to every quote read that a CUSTOMER can reach
 * (their own quote list/detail, via both the REST API and server-side
 * loaders). These fields are staff-only: the admin UI labels adminNotes
 * "Not visible to the customer", but the endpoints used to return the whole
 * document, so any customer could read them from the network tab.
 *
 * Admin reads must NOT use this projection.
 */
export const CUSTOMER_HIDDEN_QUOTE_FIELDS = "-adminNotes -reviewedBy";
