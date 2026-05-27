const ivm = require('isolated-vm');

/**
 * Run a user-provided JS transform against the response object.
 * The script receives a `res` variable with { status, headers, body }
 * and may mutate any of those fields.
 *
 * Runs inside a true V8 isolate (isolated-vm) — unlike Node's built-in
 * `vm` module, isolated-vm provides genuine process-level isolation with
 * no access to require(), process, or any outer-context globals.
 *
 * @param {string} code - JavaScript code provided by the user
 * @param {{ status: number, headers: object, body: any }} response
 * @returns {{ status: number, headers: object, body: any }} mutated response
 */
function runTransform(code, response) {
  const isolate = new ivm.Isolate({ memoryLimit: 8 });
  try {
    const context = isolate.createContextSync();
    // Inject the mutable response object via JSON (safe cross-isolate transfer)
    context.evalSync(`var res = ${JSON.stringify(response)};`);
    // Run user transform — mutates res inside the isolate
    context.evalSync(code, { timeout: 1000 });
    // Serialize result back across the isolate boundary
    const resultJson = context.evalSync('JSON.stringify(res);');
    return JSON.parse(resultJson);
  } finally {
    // Always free the isolate, even on error
    isolate.dispose();
  }
}

module.exports = { runTransform };
