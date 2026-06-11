/**
 * dbError — convert a raw PostgREST/Postgres error into a safe, user-facing
 * message while logging the real one server-side. Prevents leaking schema
 * details, constraint names, and SQL fragments to the client.
 *
 * Known, intentional messages (e.g. our slot-limit RAISE EXCEPTION) are passed
 * through so users still get actionable feedback.
 */
export function dbError(error: { message?: string; code?: string } | null, fallback = "Something went wrong. Please try again."): Error {
  if (!error) return new Error(fallback);
  // Log full detail for server-side debugging only.
  console.error("[db]", error.code ?? "", error.message ?? "");

  const msg = error.message ?? "";
  // Pass through our own friendly RAISE EXCEPTION messages.
  if (/slot limit reached/i.test(msg)) return new Error(msg);
  // Map common Postgres error codes to safe messages.
  switch (error.code) {
    case "23505": return new Error("That record already exists.");
    case "23503": return new Error("Related record not found.");
    case "23514": return new Error("That value isn't allowed.");
    case "22P02": return new Error("Invalid input format.");
    case "42501": return new Error("You don't have permission to do that.");
    default:      return new Error(fallback);
  }
}
