// Stops the current request with an HTTP error.
//
// Example: httpError(404, 'Offer not found.')
// The error handler in app.js catches it and replies with
// status 404 and { "error": "Offer not found." }.
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

module.exports = httpError;
