/**
 * Manage debugging.
 */
export default function getDebugger (isEnabled, context) {
  if (isEnabled) {
    return function (errorContext = 'error', message = '') {
      console.log(`${context}: [${errorContext}]`, message)
    }
  } else {
    return function () {}
  }
}
