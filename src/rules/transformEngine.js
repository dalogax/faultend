const vm = require('vm');

/**
 * Run a user-provided JS transform against the response object.
 * The script receives a `res` variable with { status, headers, body }
 * and may mutate any of those fields.
 *
 * Runs inside a vm sandbox with a 1-second timeout to prevent runaway scripts.
 *
 * @param {string} code - JavaScript code provided by the user
 * @param {{ status: number, headers: object, body: any }} response
 * @returns {{ status: number, headers: object, body: any }} mutated response
 */
function runTransform(code, response) {
  const sandbox = vm.createContext({ res: response });
  const script = new vm.Script(code);
  script.runInContext(sandbox, { timeout: 1000 });
  return sandbox.res;
}

module.exports = { runTransform };
