// biome-ignore-all lint: generated file
/* eslint-disable */
import { workflowEntrypoint } from 'workflow/runtime';

const workflowCode = `globalThis.__private_workflows = new Map();
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports, module2) {
    "use strict";
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\\d+)?\\.?\\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?\$/i.exec(str);
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    __name(parse, "parse");
    function fmtShort(ms2) {
      var msAbs = Math.abs(ms2);
      if (msAbs >= d) {
        return Math.round(ms2 / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms2 / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms2 / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms2 / s) + "s";
      }
      return ms2 + "ms";
    }
    __name(fmtShort, "fmtShort");
    function fmtLong(ms2) {
      var msAbs = Math.abs(ms2);
      if (msAbs >= d) {
        return plural(ms2, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms2, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms2, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms2, msAbs, s, "second");
      }
      return ms2 + " ms";
    }
    __name(fmtLong, "fmtLong");
    function plural(ms2, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
    }
    __name(plural, "plural");
  }
});

// node_modules/@workflow/utils/dist/time.js
var import_ms = __toESM(require_ms(), 1);
function parseDurationToDate(param) {
  if (typeof param === "string") {
    const durationMs = (0, import_ms.default)(param);
    if (typeof durationMs !== "number" || durationMs < 0) {
      throw new Error(\`Invalid duration: "\${param}". Expected a valid duration string like "1s", "1m", "1h", etc.\`);
    }
    return new Date(Date.now() + durationMs);
  } else if (typeof param === "number") {
    if (param < 0 || !Number.isFinite(param)) {
      throw new Error(\`Invalid duration: \${param}. Expected a non-negative finite number of milliseconds.\`);
    }
    return new Date(Date.now() + param);
  } else if (param instanceof Date || param && typeof param === "object" && typeof param.getTime === "function") {
    return param instanceof Date ? param : new Date(param.getTime());
  } else {
    throw new Error(\`Invalid duration parameter. Expected a duration string, number (milliseconds), or Date object.\`);
  }
}
__name(parseDurationToDate, "parseDurationToDate");

// node_modules/@workflow/errors/dist/index.js
var BASE_URL = "https://useworkflow.dev/err";
function isError(value) {
  return typeof value === "object" && value !== null && "name" in value && "message" in value;
}
__name(isError, "isError");
var ERROR_SLUGS = {
  NODE_JS_MODULE_IN_WORKFLOW: "node-js-module-in-workflow",
  START_INVALID_WORKFLOW_FUNCTION: "start-invalid-workflow-function",
  SERIALIZATION_FAILED: "serialization-failed",
  WEBHOOK_INVALID_RESPOND_WITH_VALUE: "webhook-invalid-respond-with-value",
  WEBHOOK_RESPONSE_NOT_SENT: "webhook-response-not-sent",
  FETCH_IN_WORKFLOW_FUNCTION: "fetch-in-workflow",
  TIMEOUT_FUNCTIONS_IN_WORKFLOW: "timeout-in-workflow",
  HOOK_CONFLICT: "hook-conflict",
  CORRUPTED_EVENT_LOG: "corrupted-event-log",
  REPLAY_DIVERGENCE: "replay-divergence",
  STEP_NOT_REGISTERED: "step-not-registered",
  WORKFLOW_NOT_REGISTERED: "workflow-not-registered",
  RUNTIME_DECRYPTION_FAILED: "runtime-decryption-failed"
};
var WorkflowError = class extends Error {
  static {
    __name(this, "WorkflowError");
  }
  cause;
  constructor(message, options) {
    const msgDocs = options?.slug ? \`\${message}

Learn more: \${BASE_URL}/\${options.slug}\` : message;
    super(msgDocs, {
      cause: options?.cause
    });
    this.cause = options?.cause;
    if (options?.cause instanceof Error) {
      this.stack = \`\${this.stack}
Caused by: \${options.cause.stack}\`;
    }
  }
  static is(value) {
    return isError(value) && value.name === "WorkflowError";
  }
};
var HookConflictError = class extends WorkflowError {
  static {
    __name(this, "HookConflictError");
  }
  token;
  // TODO: Make this required once all persisted hook_conflict events and World
  // implementations always include the active hook owner's run ID.
  conflictingRunId;
  constructor(token, conflictingRunId) {
    super(\`Hook token "\${token}" is already in use by another workflow\${conflictingRunId ? \` (run "\${conflictingRunId}")\` : ""}\`, {
      slug: ERROR_SLUGS.HOOK_CONFLICT
    });
    this.name = "HookConflictError";
    this.token = token;
    if (conflictingRunId !== void 0) {
      this.conflictingRunId = conflictingRunId;
    }
  }
  static is(value) {
    return isError(value) && value.name === "HookConflictError";
  }
};
var FatalError = class extends Error {
  static {
    __name(this, "FatalError");
  }
  fatal = true;
  constructor(message) {
    super(message);
    this.name = "FatalError";
  }
  static is(value) {
    return isError(value) && value.name === "FatalError";
  }
};
var RetryableError = class extends Error {
  static {
    __name(this, "RetryableError");
  }
  /**
   * The Date when the step should be retried.
   */
  retryAfter;
  constructor(message, options = {}) {
    super(message);
    this.name = "RetryableError";
    if (options.retryAfter !== void 0) {
      this.retryAfter = parseDurationToDate(options.retryAfter);
    } else {
      this.retryAfter = new Date(Date.now() + 1e3);
    }
  }
  static is(value) {
    return isError(value) && value.name === "RetryableError";
  }
};
var FATAL_ERROR_KEY = /* @__PURE__ */ Symbol.for("@workflow/errors//FatalError");
var RETRYABLE_ERROR_KEY = /* @__PURE__ */ Symbol.for("@workflow/errors//RetryableError");
var HOOK_CONFLICT_ERROR_KEY = /* @__PURE__ */ Symbol.for("@workflow/errors//HookConflictError");
if (typeof globalThis !== "undefined") {
  if (!Object.hasOwn(globalThis, FATAL_ERROR_KEY)) {
    Object.defineProperty(globalThis, FATAL_ERROR_KEY, {
      value: FatalError,
      writable: false,
      enumerable: false,
      configurable: false
    });
  }
  if (!Object.hasOwn(globalThis, RETRYABLE_ERROR_KEY)) {
    Object.defineProperty(globalThis, RETRYABLE_ERROR_KEY, {
      value: RetryableError,
      writable: false,
      enumerable: false,
      configurable: false
    });
  }
  if (!Object.hasOwn(globalThis, HOOK_CONFLICT_ERROR_KEY)) {
    Object.defineProperty(globalThis, HOOK_CONFLICT_ERROR_KEY, {
      value: HookConflictError,
      writable: false,
      enumerable: false,
      configurable: false
    });
  }
}

// node_modules/@workflow/core/dist/symbols.js
var WORKFLOW_SLEEP = /* @__PURE__ */ Symbol.for("WORKFLOW_SLEEP");

// node_modules/@workflow/core/dist/sleep.js
async function sleep(param) {
  const sleepFn = globalThis[WORKFLOW_SLEEP];
  if (!sleepFn) {
    throw new Error("\`sleep()\` can only be called inside a workflow function");
  }
  return sleepFn(param);
}
__name(sleep, "sleep");

// node_modules/workflow/dist/stdlib.js
var fetch = globalThis[/* @__PURE__ */ Symbol.for("WORKFLOW_USE_STEP")]("step//workflow@4.6.0//fetch");

// app/workflows/signup.ts
var createUser = globalThis[/* @__PURE__ */ Symbol.for("WORKFLOW_USE_STEP")]("step//./app/workflows/signup//createUser");
var sendWelcomeEmail = globalThis[/* @__PURE__ */ Symbol.for("WORKFLOW_USE_STEP")]("step//./app/workflows/signup//sendWelcomeEmail");
var sendOnboardingEmail = globalThis[/* @__PURE__ */ Symbol.for("WORKFLOW_USE_STEP")]("step//./app/workflows/signup//sendOnboardingEmail");
async function handleUserSignup(email) {
  const user = await createUser(email);
  await sendWelcomeEmail(user);
  await sleep("5s");
  await sendOnboardingEmail(user);
  return {
    userId: user.id,
    status: "onboarded"
  };
}
__name(handleUserSignup, "handleUserSignup");
handleUserSignup.workflowId = "workflow//./app/workflows/signup//handleUserSignup";
globalThis.__private_workflows.set("workflow//./app/workflows/signup//handleUserSignup", handleUserSignup);
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwgIm5vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvdXRpbHMvc3JjL3RpbWUudHMiLCAibm9kZV9tb2R1bGVzL0B3b3JrZmxvdy9lcnJvcnMvc3JjL2luZGV4LnRzIiwgIm5vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvY29yZS9zcmMvc3ltYm9scy50cyIsICJub2RlX21vZHVsZXMvQHdvcmtmbG93L2NvcmUvc3JjL3NsZWVwLnRzIiwgIm5vZGVfbW9kdWxlcy93b3JrZmxvdy9zcmMvc3RkbGliLnRzIiwgImFwcC93b3JrZmxvd3Mvc2lnbnVwLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIEhlbHBlcnMuXG4gKi8gdmFyIHMgPSAxMDAwO1xudmFyIG0gPSBzICogNjA7XG52YXIgaCA9IG0gKiA2MDtcbnZhciBkID0gaCAqIDI0O1xudmFyIHcgPSBkICogNztcbnZhciB5ID0gZCAqIDM2NS4yNTtcbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuICAgIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gcGFyc2UodmFsKTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbCkpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/IGZtdExvbmcodmFsKSA6IGZtdFNob3J0KHZhbCk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcigndmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSB2YWxpZCBudW1iZXIuIHZhbD0nICsgSlNPTi5zdHJpbmdpZnkodmFsKSk7XG59O1xuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi8gZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gICAgc3RyID0gU3RyaW5nKHN0cik7XG4gICAgaWYgKHN0ci5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbWF0Y2ggPSAvXigtPyg/OlxcZCspP1xcLj9cXGQrKSAqKG1pbGxpc2Vjb25kcz98bXNlY3M/fG1zfHNlY29uZHM/fHNlY3M/fHN8bWludXRlcz98bWlucz98bXxob3Vycz98aHJzP3xofGRheXM/fGR8d2Vla3M/fHd8eWVhcnM/fHlycz98eSk/JC9pLmV4ZWMoc3RyKTtcbiAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG4gPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCh0eXBlKXtcbiAgICAgICAgY2FzZSAneWVhcnMnOlxuICAgICAgICBjYXNlICd5ZWFyJzpcbiAgICAgICAgY2FzZSAneXJzJzpcbiAgICAgICAgY2FzZSAneXInOlxuICAgICAgICBjYXNlICd5JzpcbiAgICAgICAgICAgIHJldHVybiBuICogeTtcbiAgICAgICAgY2FzZSAnd2Vla3MnOlxuICAgICAgICBjYXNlICd3ZWVrJzpcbiAgICAgICAgY2FzZSAndyc6XG4gICAgICAgICAgICByZXR1cm4gbiAqIHc7XG4gICAgICAgIGNhc2UgJ2RheXMnOlxuICAgICAgICBjYXNlICdkYXknOlxuICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgICAgIHJldHVybiBuICogZDtcbiAgICAgICAgY2FzZSAnaG91cnMnOlxuICAgICAgICBjYXNlICdob3VyJzpcbiAgICAgICAgY2FzZSAnaHJzJzpcbiAgICAgICAgY2FzZSAnaHInOlxuICAgICAgICBjYXNlICdoJzpcbiAgICAgICAgICAgIHJldHVybiBuICogaDtcbiAgICAgICAgY2FzZSAnbWludXRlcyc6XG4gICAgICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgICAgIGNhc2UgJ21pbnMnOlxuICAgICAgICBjYXNlICdtaW4nOlxuICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgICAgIHJldHVybiBuICogbTtcbiAgICAgICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgICAgIGNhc2UgJ3NlY3MnOlxuICAgICAgICBjYXNlICdzZWMnOlxuICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgIHJldHVybiBuICogcztcbiAgICAgICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICAgICAgY2FzZSAnbWlsbGlzZWNvbmQnOlxuICAgICAgICBjYXNlICdtc2Vjcyc6XG4gICAgICAgIGNhc2UgJ21zZWMnOlxuICAgICAgICBjYXNlICdtcyc6XG4gICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxufVxuLyoqXG4gKiBTaG9ydCBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqLyBmdW5jdGlvbiBmbXRTaG9ydChtcykge1xuICAgIHZhciBtc0FicyA9IE1hdGguYWJzKG1zKTtcbiAgICBpZiAobXNBYnMgPj0gZCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgJ2QnO1xuICAgIH1cbiAgICBpZiAobXNBYnMgPj0gaCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICAgIH1cbiAgICBpZiAobXNBYnMgPj0gbSkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICAgIH1cbiAgICBpZiAobXNBYnMgPj0gcykge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgJ3MnO1xuICAgIH1cbiAgICByZXR1cm4gbXMgKyAnbXMnO1xufVxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovIGZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgICB2YXIgbXNBYnMgPSBNYXRoLmFicyhtcyk7XG4gICAgaWYgKG1zQWJzID49IGQpIHtcbiAgICAgICAgcmV0dXJuIHBsdXJhbChtcywgbXNBYnMsIGQsICdkYXknKTtcbiAgICB9XG4gICAgaWYgKG1zQWJzID49IGgpIHtcbiAgICAgICAgcmV0dXJuIHBsdXJhbChtcywgbXNBYnMsIGgsICdob3VyJyk7XG4gICAgfVxuICAgIGlmIChtc0FicyA+PSBtKSB7XG4gICAgICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBtLCAnbWludXRlJyk7XG4gICAgfVxuICAgIGlmIChtc0FicyA+PSBzKSB7XG4gICAgICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBzLCAnc2Vjb25kJyk7XG4gICAgfVxuICAgIHJldHVybiBtcyArICcgbXMnO1xufVxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqLyBmdW5jdGlvbiBwbHVyYWwobXMsIG1zQWJzLCBuLCBuYW1lKSB7XG4gICAgdmFyIGlzUGx1cmFsID0gbXNBYnMgPj0gbiAqIDEuNTtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG4pICsgJyAnICsgbmFtZSArIChpc1BsdXJhbCA/ICdzJyA6ICcnKTtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IFN0cmluZ1ZhbHVlIH0gZnJvbSAnbXMnO1xuaW1wb3J0IG1zIGZyb20gJ21zJztcblxuLyoqXG4gKiBQYXJzZXMgYSBkdXJhdGlvbiBwYXJhbWV0ZXIgKHN0cmluZywgbnVtYmVyLCBvciBEYXRlKSBhbmQgcmV0dXJucyBhIERhdGUgb2JqZWN0XG4gKiByZXByZXNlbnRpbmcgd2hlbiB0aGUgZHVyYXRpb24gc2hvdWxkIGVsYXBzZS5cbiAqXG4gKiAtIEZvciBzdHJpbmdzOiBQYXJzZXMgZHVyYXRpb24gc3RyaW5ncyBsaWtlIFwiMXNcIiwgXCI1bVwiLCBcIjFoXCIsIGV0Yy4gdXNpbmcgdGhlIGBtc2AgbGlicmFyeVxuICogLSBGb3IgbnVtYmVyczogVHJlYXRzIGFzIG1pbGxpc2Vjb25kcyBmcm9tIG5vd1xuICogLSBGb3IgRGF0ZSBvYmplY3RzOiBSZXR1cm5zIHRoZSBkYXRlIGRpcmVjdGx5IChoYW5kbGVzIGJvdGggRGF0ZSBpbnN0YW5jZXMgYW5kIGRhdGUtbGlrZSBvYmplY3RzIGZyb20gZGVzZXJpYWxpemF0aW9uKVxuICpcbiAqIEBwYXJhbSBwYXJhbSAtIFRoZSBkdXJhdGlvbiBwYXJhbWV0ZXIgKFN0cmluZ1ZhbHVlLCBEYXRlLCBvciBudW1iZXIgb2YgbWlsbGlzZWNvbmRzKVxuICogQHJldHVybnMgQSBEYXRlIG9iamVjdCByZXByZXNlbnRpbmcgd2hlbiB0aGUgZHVyYXRpb24gc2hvdWxkIGVsYXBzZVxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBwYXJhbWV0ZXIgaXMgaW52YWxpZCBvciBjYW5ub3QgYmUgcGFyc2VkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUR1cmF0aW9uVG9EYXRlKHBhcmFtOiBTdHJpbmdWYWx1ZSB8IERhdGUgfCBudW1iZXIpOiBEYXRlIHtcbiAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gJ3N0cmluZycpIHtcbiAgICBjb25zdCBkdXJhdGlvbk1zID0gbXMocGFyYW0pO1xuICAgIGlmICh0eXBlb2YgZHVyYXRpb25NcyAhPT0gJ251bWJlcicgfHwgZHVyYXRpb25NcyA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEludmFsaWQgZHVyYXRpb246IFwiJHtwYXJhbX1cIi4gRXhwZWN0ZWQgYSB2YWxpZCBkdXJhdGlvbiBzdHJpbmcgbGlrZSBcIjFzXCIsIFwiMW1cIiwgXCIxaFwiLCBldGMuYFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEYXRlKERhdGUubm93KCkgKyBkdXJhdGlvbk1zKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW0gPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHBhcmFtIDwgMCB8fCAhTnVtYmVyLmlzRmluaXRlKHBhcmFtKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgSW52YWxpZCBkdXJhdGlvbjogJHtwYXJhbX0uIEV4cGVjdGVkIGEgbm9uLW5lZ2F0aXZlIGZpbml0ZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRGF0ZShEYXRlLm5vdygpICsgcGFyYW0pO1xuICB9IGVsc2UgaWYgKFxuICAgIHBhcmFtIGluc3RhbmNlb2YgRGF0ZSB8fFxuICAgIChwYXJhbSAmJlxuICAgICAgdHlwZW9mIHBhcmFtID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mIChwYXJhbSBhcyBhbnkpLmdldFRpbWUgPT09ICdmdW5jdGlvbicpXG4gICkge1xuICAgIC8vIEhhbmRsZSBib3RoIERhdGUgaW5zdGFuY2VzIGFuZCBkYXRlLWxpa2Ugb2JqZWN0cyAoZnJvbSBkZXNlcmlhbGl6YXRpb24pXG4gICAgcmV0dXJuIHBhcmFtIGluc3RhbmNlb2YgRGF0ZSA/IHBhcmFtIDogbmV3IERhdGUoKHBhcmFtIGFzIGFueSkuZ2V0VGltZSgpKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgSW52YWxpZCBkdXJhdGlvbiBwYXJhbWV0ZXIuIEV4cGVjdGVkIGEgZHVyYXRpb24gc3RyaW5nLCBudW1iZXIgKG1pbGxpc2Vjb25kcyksIG9yIERhdGUgb2JqZWN0LmBcbiAgICApO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgcGFyc2VEdXJhdGlvblRvRGF0ZSB9IGZyb20gJ0B3b3JrZmxvdy91dGlscyc7XG5pbXBvcnQgdHlwZSB7IFN0cnVjdHVyZWRFcnJvciB9IGZyb20gJ0B3b3JrZmxvdy93b3JsZCc7XG5pbXBvcnQgdHlwZSB7IFN0cmluZ1ZhbHVlIH0gZnJvbSAnbXMnO1xuXG5jb25zdCBCQVNFX1VSTCA9ICdodHRwczovL3VzZXdvcmtmbG93LmRldi9lcnInO1xuXG4vKipcbiAqIEBpbnRlcm5hbFxuICogQ2hlY2sgaWYgYSB2YWx1ZSBpcyBhbiBFcnJvciB3aXRob3V0IHJlbHlpbmcgb24gTm9kZS5qcyB1dGlsaXRpZXMuXG4gKiBUaGlzIGlzIG5lZWRlZCBmb3IgZXJyb3IgY2xhc3NlcyB0aGF0IGNhbiBiZSB1c2VkIGluIFZNIGNvbnRleHRzIHdoZXJlXG4gKiBOb2RlLmpzIGltcG9ydHMgYXJlIG5vdCBhdmFpbGFibGUuXG4gKi9cbmZ1bmN0aW9uIGlzRXJyb3IodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyB7IG5hbWU6IHN0cmluZzsgbWVzc2FnZTogc3RyaW5nIH0ge1xuICByZXR1cm4gKFxuICAgIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiZcbiAgICB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgICduYW1lJyBpbiB2YWx1ZSAmJlxuICAgICdtZXNzYWdlJyBpbiB2YWx1ZVxuICApO1xufVxuXG4vKipcbiAqIEBpbnRlcm5hbFxuICogQWxsIHRoZSBzbHVncyBvZiB0aGUgZXJyb3JzIHVzZWQgZm9yIGRvY3VtZW50YXRpb24gbGlua3MuXG4gKi9cbmV4cG9ydCBjb25zdCBFUlJPUl9TTFVHUyA9IHtcbiAgTk9ERV9KU19NT0RVTEVfSU5fV09SS0ZMT1c6ICdub2RlLWpzLW1vZHVsZS1pbi13b3JrZmxvdycsXG4gIFNUQVJUX0lOVkFMSURfV09SS0ZMT1dfRlVOQ1RJT046ICdzdGFydC1pbnZhbGlkLXdvcmtmbG93LWZ1bmN0aW9uJyxcbiAgU0VSSUFMSVpBVElPTl9GQUlMRUQ6ICdzZXJpYWxpemF0aW9uLWZhaWxlZCcsXG4gIFdFQkhPT0tfSU5WQUxJRF9SRVNQT05EX1dJVEhfVkFMVUU6ICd3ZWJob29rLWludmFsaWQtcmVzcG9uZC13aXRoLXZhbHVlJyxcbiAgV0VCSE9PS19SRVNQT05TRV9OT1RfU0VOVDogJ3dlYmhvb2stcmVzcG9uc2Utbm90LXNlbnQnLFxuICBGRVRDSF9JTl9XT1JLRkxPV19GVU5DVElPTjogJ2ZldGNoLWluLXdvcmtmbG93JyxcbiAgVElNRU9VVF9GVU5DVElPTlNfSU5fV09SS0ZMT1c6ICd0aW1lb3V0LWluLXdvcmtmbG93JyxcbiAgSE9PS19DT05GTElDVDogJ2hvb2stY29uZmxpY3QnLFxuICBDT1JSVVBURURfRVZFTlRfTE9HOiAnY29ycnVwdGVkLWV2ZW50LWxvZycsXG4gIFJFUExBWV9ESVZFUkdFTkNFOiAncmVwbGF5LWRpdmVyZ2VuY2UnLFxuICBTVEVQX05PVF9SRUdJU1RFUkVEOiAnc3RlcC1ub3QtcmVnaXN0ZXJlZCcsXG4gIFdPUktGTE9XX05PVF9SRUdJU1RFUkVEOiAnd29ya2Zsb3ctbm90LXJlZ2lzdGVyZWQnLFxuICBSVU5USU1FX0RFQ1JZUFRJT05fRkFJTEVEOiAncnVudGltZS1kZWNyeXB0aW9uLWZhaWxlZCcsXG59IGFzIGNvbnN0O1xuXG50eXBlIEVycm9yU2x1ZyA9ICh0eXBlb2YgRVJST1JfU0xVR1MpW2tleW9mIHR5cGVvZiBFUlJPUl9TTFVHU107XG5cbmludGVyZmFjZSBXb3JrZmxvd0Vycm9yT3B0aW9ucyBleHRlbmRzIEVycm9yT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgc2x1ZyBvZiB0aGUgZXJyb3IuIFRoaXMgd2lsbCBiZSB1c2VkIHRvIGdlbmVyYXRlIGEgbGluayB0byB0aGUgZXJyb3IgZG9jdW1lbnRhdGlvbi5cbiAgICovXG4gIHNsdWc/OiBFcnJvclNsdWc7XG59XG5cbi8qKlxuICogVGhlIGJhc2UgY2xhc3MgZm9yIGFsbCBXb3JrZmxvdy1yZWxhdGVkIGVycm9ycy5cbiAqXG4gKiBUaGlzIGVycm9yIGlzIHRocm93biBieSB0aGUgV29ya2Zsb3cgU0RLIHdoZW4gaW50ZXJuYWwgb3BlcmF0aW9ucyBmYWlsLlxuICogWW91IGNhbiB1c2UgdGhpcyBjbGFzcyB3aXRoIGBpbnN0YW5jZW9mYCB0byBjYXRjaCBhbnkgV29ya2Zsb3cgU0RLIGVycm9yLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogdHJ5IHtcbiAqICAgYXdhaXQgZ2V0UnVuKHJ1bklkKTtcbiAqIH0gY2F0Y2ggKGVycm9yKSB7XG4gKiAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFdvcmtmbG93RXJyb3IpIHtcbiAqICAgICBjb25zb2xlLmVycm9yKCdXb3JrZmxvdyBTREsgZXJyb3I6JywgZXJyb3IubWVzc2FnZSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgV29ya2Zsb3dFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgcmVhZG9ubHkgY2F1c2U/OiB1bmtub3duO1xuXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgb3B0aW9ucz86IFdvcmtmbG93RXJyb3JPcHRpb25zKSB7XG4gICAgY29uc3QgbXNnRG9jcyA9IG9wdGlvbnM/LnNsdWdcbiAgICAgID8gYCR7bWVzc2FnZX1cXG5cXG5MZWFybiBtb3JlOiAke0JBU0VfVVJMfS8ke29wdGlvbnMuc2x1Z31gXG4gICAgICA6IG1lc3NhZ2U7XG4gICAgc3VwZXIobXNnRG9jcywgeyBjYXVzZTogb3B0aW9ucz8uY2F1c2UgfSk7XG4gICAgdGhpcy5jYXVzZSA9IG9wdGlvbnM/LmNhdXNlO1xuXG4gICAgaWYgKG9wdGlvbnM/LmNhdXNlIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHRoaXMuc3RhY2sgPSBgJHt0aGlzLnN0YWNrfVxcbkNhdXNlZCBieTogJHtvcHRpb25zLmNhdXNlLnN0YWNrfWA7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGlzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgV29ya2Zsb3dFcnJvciB7XG4gICAgcmV0dXJuIGlzRXJyb3IodmFsdWUpICYmIHZhbHVlLm5hbWUgPT09ICdXb3JrZmxvd0Vycm9yJztcbiAgfVxufVxuXG4vKipcbiAqIFRocm93biB3aGVuIGEgd29ybGQgKHN0b3JhZ2UgYmFja2VuZCkgb3BlcmF0aW9uIGZhaWxzIHVuZXhwZWN0ZWRseS5cbiAqXG4gKiBUaGlzIGlzIHRoZSBjYXRjaC1hbGwgZXJyb3IgZm9yIHdvcmxkIGltcGxlbWVudGF0aW9ucy4gU3BlY2lmaWMsXG4gKiB3ZWxsLWtub3duIGZhaWx1cmUgbW9kZXMgaGF2ZSBkZWRpY2F0ZWQgZXJyb3IgdHlwZXMgKGUuZy5cbiAqIEVudGl0eUNvbmZsaWN0RXJyb3IsIFJ1bkV4cGlyZWRFcnJvciwgVGhyb3R0bGVFcnJvcikuIFRoaXMgZXJyb3JcbiAqIGNvdmVycyBldmVyeXRoaW5nIGVsc2Ug4oCUIHZhbGlkYXRpb24gZmFpbHVyZXMsIG1pc3NpbmcgZW50aXRpZXNcbiAqIHdpdGhvdXQgYSBkZWRpY2F0ZWQgdHlwZSwgb3IgdW5leHBlY3RlZCBIVFRQIGVycm9ycyBmcm9tIHdvcmxkLXZlcmNlbC5cbiAqL1xuZXhwb3J0IGNsYXNzIFdvcmtmbG93V29ybGRFcnJvciBleHRlbmRzIFdvcmtmbG93RXJyb3Ige1xuICBzdGF0dXM/OiBudW1iZXI7XG4gIGNvZGU/OiBzdHJpbmc7XG4gIHVybD86IHN0cmluZztcbiAgLyoqIFJldHJ5LUFmdGVyIHZhbHVlIGluIHNlY29uZHMsIHByZXNlbnQgb24gNDI5IGFuZCA0MjUgcmVzcG9uc2VzICovXG4gIHJldHJ5QWZ0ZXI/OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiB7XG4gICAgICBzdGF0dXM/OiBudW1iZXI7XG4gICAgICB1cmw/OiBzdHJpbmc7XG4gICAgICBjb2RlPzogc3RyaW5nO1xuICAgICAgcmV0cnlBZnRlcj86IG51bWJlcjtcbiAgICAgIGNhdXNlPzogdW5rbm93bjtcbiAgICB9XG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UsIHtcbiAgICAgIGNhdXNlOiBvcHRpb25zPy5jYXVzZSxcbiAgICB9KTtcbiAgICB0aGlzLm5hbWUgPSAnV29ya2Zsb3dXb3JsZEVycm9yJztcbiAgICB0aGlzLnN0YXR1cyA9IG9wdGlvbnM/LnN0YXR1cztcbiAgICB0aGlzLmNvZGUgPSBvcHRpb25zPy5jb2RlO1xuICAgIHRoaXMudXJsID0gb3B0aW9ucz8udXJsO1xuICAgIHRoaXMucmV0cnlBZnRlciA9IG9wdGlvbnM/LnJldHJ5QWZ0ZXI7XG4gIH1cblxuICBzdGF0aWMgaXModmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBXb3JrZmxvd1dvcmxkRXJyb3Ige1xuICAgIHJldHVybiBpc0Vycm9yKHZhbHVlKSAmJiB2YWx1ZS5uYW1lID09PSAnV29ya2Zsb3dXb3JsZEVycm9yJztcbiAgfVxufVxuXG4vKipcbiAqIFRocm93biB3aGVuIGEgd29ya2Zsb3cgcnVuIGZhaWxzIGR1cmluZyBleGVjdXRpb24uXG4gKlxuICogVGhpcyBlcnJvciBpbmRpY2F0ZXMgdGhhdCB0aGUgd29ya2Zsb3cgZW5jb3VudGVyZWQgYSBmYXRhbCBlcnJvciBhbmQgY2Fubm90XG4gKiBjb250aW51ZS4gSXQgaXMgdGhyb3duIHdoZW4gYXdhaXRpbmcgYHJ1bi5yZXR1cm5WYWx1ZWAgb24gYSBydW4gd2hvc2Ugc3RhdHVzXG4gKiBpcyBgJ2ZhaWxlZCdgLiBUaGUgYGNhdXNlYCBwcm9wZXJ0eSBjb250YWlucyB0aGUgdW5kZXJseWluZyBlcnJvciB3aXRoIGl0c1xuICogbWVzc2FnZSwgc3RhY2sgdHJhY2UsIGFuZCBvcHRpb25hbCBlcnJvciBjb2RlLlxuICpcbiAqIFVzZSB0aGUgc3RhdGljIGBXb3JrZmxvd1J1bkZhaWxlZEVycm9yLmlzKClgIG1ldGhvZCBmb3IgdHlwZS1zYWZlIGNoZWNraW5nXG4gKiBpbiBjYXRjaCBibG9ja3MuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBXb3JrZmxvd1J1bkZhaWxlZEVycm9yIH0gZnJvbSBcIndvcmtmbG93L2ludGVybmFsL2Vycm9yc1wiO1xuICpcbiAqIHRyeSB7XG4gKiAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJ1bi5yZXR1cm5WYWx1ZTtcbiAqIH0gY2F0Y2ggKGVycm9yKSB7XG4gKiAgIGlmIChXb3JrZmxvd1J1bkZhaWxlZEVycm9yLmlzKGVycm9yKSkge1xuICogICAgIGNvbnNvbGUuZXJyb3IoYFJ1biAke2Vycm9yLnJ1bklkfSBmYWlsZWQ6YCwgZXJyb3IuY2F1c2UubWVzc2FnZSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgV29ya2Zsb3dSdW5GYWlsZWRFcnJvciBleHRlbmRzIFdvcmtmbG93RXJyb3Ige1xuICBydW5JZDogc3RyaW5nO1xuICBkZWNsYXJlIGNhdXNlOiBFcnJvciAmIHsgY29kZT86IHN0cmluZyB9O1xuXG4gIGNvbnN0cnVjdG9yKHJ1bklkOiBzdHJpbmcsIGVycm9yOiBTdHJ1Y3R1cmVkRXJyb3IpIHtcbiAgICAvLyBDcmVhdGUgYSBwcm9wZXIgRXJyb3IgaW5zdGFuY2UgZnJvbSB0aGUgU3RydWN0dXJlZEVycm9yIHRvIHNldCBhcyBjYXVzZVxuICAgIC8vIE5PVEU6IGN1c3RvbSBlcnJvciB0eXBlcyBkbyBub3QgZ2V0IHNlcmlhbGl6ZWQvZGVzZXJpYWxpemVkLiBFdmVyeXRoaW5nIGlzIGFuIEVycm9yXG4gICAgY29uc3QgY2F1c2VFcnJvciA9IG5ldyBFcnJvcihlcnJvci5tZXNzYWdlKTtcbiAgICBpZiAoZXJyb3Iuc3RhY2spIHtcbiAgICAgIGNhdXNlRXJyb3Iuc3RhY2sgPSBlcnJvci5zdGFjaztcbiAgICB9XG4gICAgaWYgKGVycm9yLmNvZGUpIHtcbiAgICAgIChjYXVzZUVycm9yIGFzIGFueSkuY29kZSA9IGVycm9yLmNvZGU7XG4gICAgfVxuXG4gICAgc3VwZXIoYFdvcmtmbG93IHJ1biBcIiR7cnVuSWR9XCIgZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCwge1xuICAgICAgY2F1c2U6IGNhdXNlRXJyb3IsXG4gICAgfSk7XG4gICAgdGhpcy5uYW1lID0gJ1dvcmtmbG93UnVuRmFpbGVkRXJyb3InO1xuICAgIHRoaXMucnVuSWQgPSBydW5JZDtcbiAgfVxuXG4gIHN0YXRpYyBpcyh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFdvcmtmbG93UnVuRmFpbGVkRXJyb3Ige1xuICAgIHJldHVybiBpc0Vycm9yKHZhbHVlKSAmJiB2YWx1ZS5uYW1lID09PSAnV29ya2Zsb3dSdW5GYWlsZWRFcnJvcic7XG4gIH1cbn1cblxuLyoqXG4gKiBUaHJvd24gd2hlbiBhdHRlbXB0aW5nIHRvIGdldCByZXN1bHRzIGZyb20gYW4gaW5jb21wbGV0ZSB3b3JrZmxvdyBydW4uXG4gKlxuICogVGhpcyBlcnJvciBvY2N1cnMgd2hlbiB5b3UgdHJ5IHRvIGFjY2VzcyB0aGUgcmVzdWx0IG9mIGEgd29ya2Zsb3dcbiAqIHRoYXQgaXMgc3RpbGwgcnVubmluZyBvciBoYXNuJ3QgY29tcGxldGVkIHlldC5cbiAqL1xuZXhwb3J0IGNsYXNzIFdvcmtmbG93UnVuTm90Q29tcGxldGVkRXJyb3IgZXh0ZW5kcyBXb3JrZmxvd0Vycm9yIHtcbiAgcnVuSWQ6IHN0cmluZztcbiAgc3RhdHVzOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocnVuSWQ6IHN0cmluZywgc3RhdHVzOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgV29ya2Zsb3cgcnVuIFwiJHtydW5JZH1cIiBoYXMgbm90IGNvbXBsZXRlZGAsIHt9KTtcbiAgICB0aGlzLm5hbWUgPSAnV29ya2Zsb3dSdW5Ob3RDb21wbGV0ZWRFcnJvcic7XG4gICAgdGhpcy5ydW5JZCA9IHJ1bklkO1xuICAgIHRoaXMuc3RhdHVzID0gc3RhdHVzO1xuICB9XG5cbiAgc3RhdGljIGlzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgV29ya2Zsb3dSdW5Ob3RDb21wbGV0ZWRFcnJvciB7XG4gICAgcmV0dXJuIGlzRXJyb3IodmFsdWUpICYmIHZhbHVlLm5hbWUgPT09ICdXb3JrZmxvd1J1bk5vdENvbXBsZXRlZEVycm9yJztcbiAgfVxufVxuXG4vKipcbiAqIFRocm93biB3aGVuIHRoZSBXb3JrZmxvdyBydW50aW1lIGVuY291bnRlcnMgYW4gaW50ZXJuYWwgZXJyb3IuXG4gKlxuICogVGhpcyBlcnJvciBpbmRpY2F0ZXMgYW4gaXNzdWUgd2l0aCB3b3JrZmxvdyBleGVjdXRpb24sIHN1Y2ggYXNcbiAqIHNlcmlhbGl6YXRpb24gZmFpbHVyZXMsIHN0YXJ0aW5nIGFuIGludmFsaWQgd29ya2Zsb3cgZnVuY3Rpb24sIG9yXG4gKiBvdGhlciBydW50aW1lIHByb2JsZW1zLlxuICovXG5leHBvcnQgY2xhc3MgV29ya2Zsb3dSdW50aW1lRXJyb3IgZXh0ZW5kcyBXb3JrZmxvd0Vycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBvcHRpb25zPzogV29ya2Zsb3dFcnJvck9wdGlvbnMpIHtcbiAgICBzdXBlcihtZXNzYWdlLCB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgIH0pO1xuICAgIHRoaXMubmFtZSA9ICdXb3JrZmxvd1J1bnRpbWVFcnJvcic7XG4gIH1cblxuICBzdGF0aWMgaXModmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBXb3JrZmxvd1J1bnRpbWVFcnJvciB7XG4gICAgcmV0dXJuIGlzRXJyb3IodmFsdWUpICYmIHZhbHVlLm5hbWUgPT09ICdXb3JrZmxvd1J1bnRpbWVFcnJvcic7XG4gIH1cbn1cblxuLyoqXG4gKiBUaHJvd24gd2hlbiB0aGUgcGVyc2lzdGVkIHdvcmtmbG93IGV2ZW50IGxvZyBjYW5ub3QgYmUgcmVwbGF5ZWQgYmVjYXVzZSBpdFxuICogY29udGFpbnMgb3JwaGFuZWQsIGR1cGxpY2F0ZSwgb3IgbWlzbWF0Y2hlZCBldmVudHMuXG4gKlxuICogVGhpcyBpcyBhIHJ1bnRpbWUvaW5mcmFzdHJ1Y3R1cmUgZmFpbHVyZSByYXRoZXIgdGhhbiB1c2VyIGNvZGUgdGhyb3dpbmcuXG4gKiBXaGVuIHRoaXMgcmVhY2hlcyBydW4gZmFpbHVyZSBoYW5kbGluZywgaXQgaXMgcmVjb3JkZWQgd2l0aCB0aGUgZGlzdGluY3RcbiAqIGBDT1JSVVBURURfRVZFTlRfTE9HYCBjb2RlIHNvIHdvcmxkcyBhbmQgYmFja2VuZHMgY2FuIHRyYWNrIGl0IHNlcGFyYXRlbHlcbiAqIGZyb20gZ2VuZXJpYyBydW50aW1lIGZhaWx1cmVzLlxuICovXG5leHBvcnQgY2xhc3MgQ29ycnVwdGVkRXZlbnRMb2dFcnJvciBleHRlbmRzIFdvcmtmbG93UnVudGltZUVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBvcHRpb25zPzogRXJyb3JPcHRpb25zKSB7XG4gICAgc3VwZXIobWVzc2FnZSwge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIHNsdWc6IEVSUk9SX1NMVUdTLkNPUlJVUFRFRF9FVkVOVF9MT0csXG4gICAgfSk7XG4gICAgdGhpcy5uYW1lID0gJ0NvcnJ1cHRlZEV2ZW50TG9nRXJyb3InO1xuICB9XG5cbiAgc3RhdGljIGlzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgQ29ycnVwdGVkRXZlbnRMb2dFcnJvciB7XG4gICAgcmV0dXJuIGlzRXJyb3IodmFsdWUpICYmIHZhbHVlLm5hbWUgPT09ICdDb3JydXB0ZWRFdmVudExvZ0Vycm9yJztcbiAgfVxufVxuXG4vKipcbiAqIE9wdGlvbmFsIHN0cnVjdHVyZWQgY29udGV4dCBhdHRhY2hlZCB0byBhIHtAbGluayBSdW50aW1lRGVjcnlwdGlvbkVycm9yfSxcbiAqIGNhcnJpZWQgb3ZlciBmcm9tIHRoZSB1bmRlcmx5aW5nIGRlY3J5cHQgY2FsbCBzaXRlIHRvIGhlbHAgZGlhZ25vc2UgdGhlXG4gKiBmYWlsdXJlIHdpdGhvdXQgcG9raW5nIHRocm91Z2ggc3RhY2tzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJ1bnRpbWVEZWNyeXB0aW9uRXJyb3JDb250ZXh0IHtcbiAgLyoqIFRoZSBvcGVyYXRpb24gdGhhdCBmYWlsZWQg4oCUIHVzZWZ1bCB0byB0ZWxsIGVuY3J5cHQgdnMgZGVjcnlwdCBhcGFydC4gKi9cbiAgb3BlcmF0aW9uPzogJ2VuY3J5cHQnIHwgJ2RlY3J5cHQnO1xuICAvKiogQnl0ZSBsZW5ndGggb2YgdGhlIGlucHV0IHBheWxvYWQgYXQgdGhlIHRpbWUgb2YgdGhlIGZhaWx1cmUuICovXG4gIGJ5dGVMZW5ndGg/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBUaGUgZmlyc3QgNCBieXRlcyBvZiB0aGUgaW5wdXQgcGF5bG9hZCwgZGVjb2RlZCBhcyBVVEYtOCBpZiBwcmludGFibGUuXG4gICAqIFVzZWZ1bCBmb3IgdGVsbGluZyBhcGFydCB0cnVuY2F0ZWQtYnV0LXZhbGlkLWxvb2tpbmcgZW5jcnlwdGVkIHBheWxvYWRzXG4gICAqIGZyb20gY29tcGxldGVseSB1bnJlbGF0ZWQgY29ycnVwdGlvbiAoZS5nLiBhbiBIVE1MIGVycm9yIHBhZ2Ugc3VyZmFjZWRcbiAgICogYXMgYSAyMDAgT0spLlxuICAgKi9cbiAgZm9ybWF0UHJlZml4Pzogc3RyaW5nO1xufVxuXG4vKipcbiAqIFRocm93biB3aGVuIHRoZSBTREsncyBidWlsdC1pbiBBRVMtR0NNIGVuY3J5cHRpb24gbGF5ZXIgZmFpbHMgdG8gZW5jcnlwdFxuICogb3IgZGVjcnlwdCBhIHdvcmtmbG93IHBheWxvYWQuXG4gKlxuICogVGhpcyBpcyBhbiBpbnRlcm5hbCBTREsgZmFpbHVyZSDigJQgdXNlciBjb2RlIG5ldmVyIGludm9rZXMgdGhlIFNESydzXG4gKiBlbmNyeXB0aW9uIHByaW1pdGl2ZXMgZGlyZWN0bHkuIENvbW1vbiBjYXVzZXM6XG4gKlxuICogLSBBIGNpcGhlcnRleHQgLyBhdXRoIHRhZyBtaXNtYXRjaCwgdHlwaWNhbGx5IHN1cmZhY2VkIGFzIHRoZSBuYXRpdmUgV2ViXG4gKiAgIENyeXB0byBgT3BlcmF0aW9uRXJyb3I6IFRoZSBvcGVyYXRpb24gZmFpbGVkIGZvciBhbiBvcGVyYXRpb24tc3BlY2lmaWNcbiAqICAgcmVhc29uYC4gVXN1YWxseSBjYXVzZWQgYnkgY2lwaGVydGV4dCBtdXRhdGlvbiBvciB0cnVuY2F0aW9uIGluIHRyYW5zaXRcbiAqICAgYmV0d2VlbiBzdG9yYWdlIGFuZCByZWFkICh0cnVuY2F0ZWQgSFRUUCByZXNwb25zZSwgZWRnZS1jYWNoZSBtaXNzXG4gKiAgIHJldHVybmluZyBhIHBhcnRpYWwgMjAwLCBwcm94eSBkcm9wIGR1cmluZyBzdHJlYW1pbmcsIGV0Yy4pLlxuICogLSBBIGtleSByZXNvbHV0aW9uIG1pc21hdGNoICh3cm9uZyBkZXBsb3ltZW50LCBtaXNzaW5nIGtleSBtYXRlcmlhbCkuXG4gKiAtIEEgbWFsZm9ybWVkIGVuY3J5cHRlZCBlbnZlbG9wZSAodG9vIHNob3J0IHRvIGNvbnRhaW4gdGhlIEdDTSBub25jZVxuICogICBhbmQgdGFnKS5cbiAqXG4gKiBFeHRlbmRzIHtAbGluayBXb3JrZmxvd1J1bnRpbWVFcnJvcn0gc28gdGhlIHJ1bi1mYWlsdXJlIGNsYXNzaWZpZXJcbiAqIHJvdXRlcyBpdCB0byBgUlVOVElNRV9FUlJPUmAuXG4gKi9cbmV4cG9ydCBjbGFzcyBSdW50aW1lRGVjcnlwdGlvbkVycm9yIGV4dGVuZHMgV29ya2Zsb3dSdW50aW1lRXJyb3Ige1xuICAvKiogT3B0aW9uYWwgc3RydWN0dXJlZCBjb250ZXh0IGFib3V0IHRoZSBmYWlsZWQgZW5jcnlwdC9kZWNyeXB0IGNhbGwuICovXG4gIHJlYWRvbmx5IGNvbnRleHQ/OiBSdW50aW1lRGVjcnlwdGlvbkVycm9yQ29udGV4dDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IEVycm9yT3B0aW9ucyAmIHsgY29udGV4dD86IFJ1bnRpbWVEZWNyeXB0aW9uRXJyb3JDb250ZXh0IH1cbiAgKSB7XG4gICAgc3VwZXIobWVzc2FnZSwge1xuICAgICAgY2F1c2U6IG9wdGlvbnM/LmNhdXNlLFxuICAgICAgc2x1ZzogRVJST1JfU0xVR1MuUlVOVElNRV9ERUNSWVBUSU9OX0ZBSUxFRCxcbiAgICB9KTtcbiAgICB0aGlzLm5hbWUgPSAnUnVudGltZURlY3J5cHRpb25FcnJvcic7XG4gICAgaWYgKG9wdGlvbnM/LmNvbnRleHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5jb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0O1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBpcyh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFJ1bnRpbWVEZWNyeXB0aW9uRXJyb3Ige1xuICAgIHJldHVybiBpc0Vycm9yKHZhbHVlKSAmJiB2YWx1ZS5uYW1lID09PSAnUnVudGltZURlY3J5cHRpb25FcnJvcic7XG4gIH1cbn1cblxuLyoqXG4gKiBUaHJvd24gd2hlbiB0aGUgY3VycmVudCB3b3JrZmxvdyByZXBsYXkgY2Fubm90IGZvbGxvdyB0aGUgcGF0aCBkZXNjcmliZWQgYnlcbiAqIHRoZSByZWNvcmRlZCBldmVudCBsb2cuIEEgc2luZ2xlIGRpdmVyZ2VuY2UgZG9lcyBub3QgcHJvdmUgdGhhdCB0aGVcbiAqIHBlcnNpc3RlZCBoaXN0b3J5IGlzIGludmFsaWQ6IGEgc3Vic2VxdWVudCByZXBsYXkgbWF5IG9ic2VydmUgb3Igc2NoZWR1bGVcbiAqIHdvcmsgY29ycmVjdGx5LCBzbyB0aGUgcnVudGltZSBtYXkgcmVkZWxpdmVyIGJlZm9yZSBkZWNsYXJpbmcgY29ycnVwdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlcGxheURpdmVyZ2VuY2VFcnJvciBleHRlbmRzIFdvcmtmbG93UnVudGltZUVycm9yIHtcbiAgcmVhZG9ubHkgZXZlbnRJZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgb3B0aW9uczogRXJyb3JPcHRpb25zICYgeyBldmVudElkOiBzdHJpbmcgfSkge1xuICAgIHN1cGVyKG1lc3NhZ2UsIHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBzbHVnOiBFUlJPUl9TTFVHUy5SRVBMQVlfRElWRVJHRU5DRSxcbiAgICB9KTtcbiAgICB0aGlzLm5hbWUgPSAnUmVwbGF5RGl2ZXJnZW5jZUVycm9yJztcbiAgICB0aGlzLmV2ZW50SWQgPSBvcHRpb25zLmV2ZW50SWQ7XG4gIH1cblxuICBzdGF0aWMgaXModmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBSZXBsYXlEaXZlcmdlbmNlRXJyb3Ige1xuICAgIHJldHVybiBpc0Vycm9yKHZhbHVlKSAmJiB2YWx1ZS5uYW1lID09PSAnUmVwbGF5RGl2ZXJnZW5jZUVycm9yJztcbiAgfVxufVxuXG4vKipcbiAqIFRocm93biB3aGVuIGEgc3RlcCBmdW5jdGlvbiBpcyBub3QgcmVnaXN0ZXJlZCBpbiB0aGUgY3VycmVudCBkZXBsb3ltZW50LlxuICpcbiAqIFRoaXMgaXMgYW4gaW5mcmFzdHJ1Y3R1cmUgZXJyb3Ig4oCUIG5vdCBhIHVzZXIgY29kZSBlcnJvci4gSXQgdHlwaWNhbGx5IG1lYW5zXG4gKiBzb21ldGhpbmcgd2VudCB3cm9uZyB3aXRoIHRoZSBidW5kbGluZy9idWlsZCB0b29saW5nIHRoYXQgY2F1c2VkIHRoZSBzdGVwXG4gKiB0byBub3QgZ2V0IGJ1aWx0IGNvcnJlY3RseS5cbiAqXG4gKiBXaGVuIHRoaXMgaGFwcGVucywgdGhlIHN0ZXAgZmFpbHMgKGxpa2UgYSBGYXRhbEVycm9yKSBhbmQgY29udHJvbCBpcyBwYXNzZWQgYmFja1xuICogdG8gdGhlIHdvcmtmbG93IGZ1bmN0aW9uLCB3aGljaCBjYW4gb3B0aW9uYWxseSBoYW5kbGUgdGhlIGZhaWx1cmUgZ3JhY2VmdWxseS5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0ZXBOb3RSZWdpc3RlcmVkRXJyb3IgZXh0ZW5kcyBXb3JrZmxvd1J1bnRpbWVFcnJvciB7XG4gIHN0ZXBOYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc3RlcE5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgYFN0ZXAgXCIke3N0ZXBOYW1lfVwiIGlzIG5vdCByZWdpc3RlcmVkIGluIHRoZSBjdXJyZW50IGRlcGxveW1lbnQuIFRoaXMgdXN1YWxseSBpbmRpY2F0ZXMgYSBidWlsZCBvciBidW5kbGluZyBpc3N1ZSB0aGF0IGNhdXNlZCB0aGUgc3RlcCB0byBub3QgYmUgaW5jbHVkZWQgaW4gdGhlIGRlcGxveW1lbnQuYCxcbiAgICAgIHsgc2x1ZzogRVJST1JfU0xVR1MuU1RFUF9OT1RfUkVHSVNURVJFRCB9XG4gICAgKTtcbiAgICB0aGlzLm5hbWUgPSAnU3RlcE5vdFJlZ2lzdGVyZWRFcnJvcic7XG4gICAgdGhpcy5zdGVwTmFtZSA9IHN0ZXBOYW1lO1xuICB9XG5cbiAgc3RhdGljIGlzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgU3RlcE5vdFJlZ2lzdGVyZWRFcnJvciB7XG4gICAgcmV0dXJuIGlzRXJyb3IodmFsdWUpICYmIHZhbHVlLm5hbWUgPT09ICdTdGVwTm90UmVnaXN0ZXJlZEVycm9yJztcbiAgfVxufVxuXG4vKipcbiAqIFRocm93biB3aGVuIGEgd29ya2Zsb3cgZnVuY3Rpb24gaXMgbm90IHJlZ2lzdGVyZWQgaW4gdGhlIGN1cnJlbnQgZGVwbG95bWVudC5cbiAqXG4gKiBUaGlzIGlzIGFuIGluZnJhc3RydWN0dXJlIGVycm9yIOKAlCBub3QgYSB1c2VyIGNvZGUgZXJyb3IuIEl0IHR5cGljYWxseSBtZWFuczpcbiAqIC0gQSBydW4gd2FzIHN0YXJ0ZWQgYWdhaW5zdCBhIGRlcGxveW1lbnQgdGhhdCBkb2VzIG5vdCBoYXZlIHRoZSB3b3JrZmxvd1xuICogICAoZS5nLiwgdGhlIHdvcmtmbG93IHdhcyByZW5hbWVkIG9yIG1vdmVkIGFuZCBhIG5ldyBydW4gdGFyZ2V0ZWQgdGhlIGxhdGVzdCBkZXBsb3ltZW50KVxuICogLSBTb21ldGhpbmcgd2VudCB3cm9uZyB3aXRoIHRoZSBidW5kbGluZy9idWlsZCB0b29saW5nIHRoYXQgY2F1c2VkIHRoZSB3b3JrZmxvd1xuICogICB0byBub3QgZ2V0IGJ1aWx0IGNvcnJlY3RseVxuICpcbiAqIFdoZW4gdGhpcyBoYXBwZW5zLCB0aGUgcnVuIGZhaWxzIHdpdGggYSBgUlVOVElNRV9FUlJPUmAgZXJyb3IgY29kZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFdvcmtmbG93Tm90UmVnaXN0ZXJlZEVycm9yIGV4dGVuZHMgV29ya2Zsb3dSdW50aW1lRXJyb3Ige1xuICB3b3JrZmxvd05hbWU6IHN0cmluZztcblxuICBjb25zdHJ1Y3Rvcih3b3JrZmxvd05hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgYFdvcmtmbG93IFwiJHt3b3JrZmxvd05hbWV9XCIgaXMgbm90IHJlZ2lzdGVyZWQgaW4gdGhlIGN1cnJlbnQgZGVwbG95bWVudC4gVGhpcyB1c3VhbGx5IG1lYW5zIGEgcnVuIHdhcyBzdGFydGVkIGFnYWluc3QgYSBkZXBsb3ltZW50IHRoYXQgZG9lcyBub3QgaGF2ZSB0aGlzIHdvcmtmbG93LCBvciB0aGVyZSB3YXMgYSBidWlsZC9idW5kbGluZyBpc3N1ZS5gLFxuICAgICAgeyBzbHVnOiBFUlJPUl9TTFVHUy5XT1JLRkxPV19OT1RfUkVHSVNURVJFRCB9XG4gICAgKTtcbiAgICB0aGlzLm5hbWUgPSAnV29ya2Zsb3dOb3RSZWdpc3RlcmVkRXJyb3InO1xuICAgIHRoaXMud29ya2Zsb3dOYW1lID0gd29ya2Zsb3dOYW1lO1xuICB9XG5cbiAgc3RhdGljIGlzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgV29ya2Zsb3dOb3RSZWdpc3RlcmVkRXJyb3Ige1xuICAgIHJldHVybiBpc0Vycm9yKHZhbHVlKSAmJiB2YWx1ZS5uYW1lID09PSAnV29ya2Zsb3dOb3RSZWdpc3RlcmVkRXJyb3InO1xuICB9XG59XG5cbi8qKlxuICogVGhyb3duIHdoZW4gcGVyZm9ybWluZyBvcGVyYXRpb25zIG9uIGEgd29ya2Zsb3cgcnVuIHRoYXQgZG9lcyBub3QgZXhpc3QuXG4gKlxuICogVGhpcyBlcnJvciBvY2N1cnMgd2hlbiB5b3UgY2FsbCBtZXRob2RzIG9uIGEgcnVuIG9iamVjdCAoZS5nLiBgcnVuLnN0YXR1c2AsXG4gKiBgcnVuLmNhbmNlbCgpYCwgYHJ1bi5yZXR1cm5WYWx1ZWApIGJ1dCB0aGUgdW5kZXJseWluZyBydW4gSUQgZG9lcyBub3QgbWF0Y2hcbiAqIGFueSBrbm93biB3b3JrZmxvdyBydW4uIE5vdGUgdGhhdCBgZ2V0UnVuKGlkKWAgaXRzZWxmIGlzIHN5bmNocm9ub3VzIGFuZCB3aWxsXG4gKiBub3QgdGhyb3cg4oCUIHRoaXMgZXJyb3IgaXMgcmFpc2VkIHdoZW4gc3Vic2VxdWVudCBvcGVyYXRpb25zIGRpc2NvdmVyIHRoZSBydW5cbiAqIGlzIG1pc3NpbmcuXG4gKlxuICogVXNlIHRoZSBzdGF0aWMgYFdvcmtmbG93UnVuTm90Rm91bmRFcnJvci5pcygpYCBtZXRob2QgZm9yIHR5cGUtc2FmZSBjaGVja2luZ1xuICogaW4gY2F0Y2ggYmxvY2tzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgV29ya2Zsb3dSdW5Ob3RGb3VuZEVycm9yIH0gZnJvbSBcIndvcmtmbG93L2ludGVybmFsL2Vycm9yc1wiO1xuICpcbiAqIHRyeSB7XG4gKiAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHJ1bi5zdGF0dXM7XG4gKiB9IGNhdGNoIChlcnJvcikge1xuICogICBpZiAoV29ya2Zsb3dSdW5Ob3RGb3VuZEVycm9yLmlzKGVycm9yKSkge1xuICogICAgIGNvbnNvbGUuZXJyb3IoYFJ1biAke2Vycm9yLnJ1bklkfSBkb2VzIG5vdCBleGlzdGApO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFdvcmtmbG93UnVuTm90Rm91bmRFcnJvciBleHRlbmRzIFdvcmtmbG93RXJyb3Ige1xuICBydW5JZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHJ1bklkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgV29ya2Zsb3cgcnVuIFwiJHtydW5JZH1cIiBub3QgZm91bmRgLCB7fSk7XG4gICAgdGhpcy5uYW1lID0gJ1dvcmtmbG93UnVuTm90Rm91bmRFcnJvcic7XG4gICAgdGhpcy5ydW5JZCA9IHJ1bklkO1xuICB9XG5cbiAgc3RhdGljIGlzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgV29ya2Zsb3dSdW5Ob3RGb3VuZEVycm9yIHtcbiAgICByZXR1cm4gaXNFcnJvcih2YWx1ZSkgJiYgdmFsdWUubmFtZSA9PT0gJ1dvcmtmbG93UnVuTm90Rm91bmRFcnJvcic7XG4gIH1cbn1cblxuLyoqXG4gKiBUaHJvd24gd2hlbiBhIGhvb2sgdG9rZW4gaXMgYWxyZWFkeSBpbiB1c2UgYnkgYW5vdGhlciBhY3RpdmUgd29ya2Zsb3cgcnVuLlxuICpcbiAqIFRoaXMgaXMgYSB1c2VyIGVycm9yIOKAlCBpdCBtZWFucyB0aGUgc2FtZSBjdXN0b20gdG9rZW4gd2FzIHBhc3NlZCB0b1xuICogYGNyZWF0ZUhvb2tgIGluIHR3byBvciBtb3JlIGNvbmN1cnJlbnQgcnVucy4gVXNlIGEgdW5pcXVlIHRva2VuIHBlciBydW5cbiAqIChvciBvbWl0IHRoZSB0b2tlbiB0byBsZXQgdGhlIHJ1bnRpbWUgZ2VuZXJhdGUgb25lIGF1dG9tYXRpY2FsbHkpLlxuICovXG5leHBvcnQgY2xhc3MgSG9va0NvbmZsaWN0RXJyb3IgZXh0ZW5kcyBXb3JrZmxvd0Vycm9yIHtcbiAgdG9rZW46IHN0cmluZztcbiAgLy8gVE9ETzogTWFrZSB0aGlzIHJlcXVpcmVkIG9uY2UgYWxsIHBlcnNpc3RlZCBob29rX2NvbmZsaWN0IGV2ZW50cyBhbmQgV29ybGRcbiAgLy8gaW1wbGVtZW50YXRpb25zIGFsd2F5cyBpbmNsdWRlIHRoZSBhY3RpdmUgaG9vayBvd25lcidzIHJ1biBJRC5cbiAgY29uZmxpY3RpbmdSdW5JZD86IHN0cmluZztcblxuICBjb25zdHJ1Y3Rvcih0b2tlbjogc3RyaW5nLCBjb25mbGljdGluZ1J1bklkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBgSG9vayB0b2tlbiBcIiR7dG9rZW59XCIgaXMgYWxyZWFkeSBpbiB1c2UgYnkgYW5vdGhlciB3b3JrZmxvdyR7Y29uZmxpY3RpbmdSdW5JZCA/IGAgKHJ1biBcIiR7Y29uZmxpY3RpbmdSdW5JZH1cIilgIDogJyd9YCxcbiAgICAgIHtcbiAgICAgICAgc2x1ZzogRVJST1JfU0xVR1MuSE9PS19DT05GTElDVCxcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMubmFtZSA9ICdIb29rQ29uZmxpY3RFcnJvcic7XG4gICAgdGhpcy50b2tlbiA9IHRva2VuO1xuICAgIGlmIChjb25mbGljdGluZ1J1bklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuY29uZmxpY3RpbmdSdW5JZCA9IGNvbmZsaWN0aW5nUnVuSWQ7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGlzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgSG9va0NvbmZsaWN0RXJyb3Ige1xuICAgIHJldHVybiBpc0Vycm9yKHZhbHVlKSAmJiB2YWx1ZS5uYW1lID09PSAnSG9va0NvbmZsaWN0RXJyb3InO1xuICB9XG59XG5cbi8qKlxuICogVGhyb3duIHdoZW4gY2FsbGluZyBgcmVzdW1lSG9vaygpYCBvciBgcmVzdW1lV2ViaG9vaygpYCB3aXRoIGEgdG9rZW4gdGhhdFxuICogZG9lcyBub3QgbWF0Y2ggYW55IGFjdGl2ZSBob29rLlxuICpcbiAqIENvbW1vbiBjYXVzZXM6XG4gKiAtIFRoZSBob29rIGhhcyBleHBpcmVkIChwYXN0IGl0cyBUVEwpXG4gKiAtIFRoZSBob29rIHdhcyBhbHJlYWR5IGRpc3Bvc2VkIGFmdGVyIGJlaW5nIGNvbnN1bWVkXG4gKiAtIFRoZSB3b3JrZmxvdyBoYXMgbm90IHN0YXJ0ZWQgeWV0LCBzbyB0aGUgaG9vayBkb2VzIG5vdCBleGlzdFxuICpcbiAqIEEgY29tbW9uIHBhdHRlcm4gaXMgdG8gY2F0Y2ggdGhpcyBlcnJvciBhbmQgc3RhcnQgYSBuZXcgd29ya2Zsb3cgcnVuIHdoZW5cbiAqIHRoZSBob29rIGRvZXMgbm90IGV4aXN0IHlldCAodGhlIFwicmVzdW1lIG9yIHN0YXJ0XCIgcGF0dGVybikuXG4gKlxuICogVXNlIHRoZSBzdGF0aWMgYEhvb2tOb3RGb3VuZEVycm9yLmlzKClgIG1ldGhvZCBmb3IgdHlwZS1zYWZlIGNoZWNraW5nIGluXG4gKiBjYXRjaCBibG9ja3MuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBIb29rTm90Rm91bmRFcnJvciB9IGZyb20gXCJ3b3JrZmxvdy9pbnRlcm5hbC9lcnJvcnNcIjtcbiAqXG4gKiB0cnkge1xuICogICBhd2FpdCByZXN1bWVIb29rKHRva2VuLCBwYXlsb2FkKTtcbiAqIH0gY2F0Y2ggKGVycm9yKSB7XG4gKiAgIGlmIChIb29rTm90Rm91bmRFcnJvci5pcyhlcnJvcikpIHtcbiAqICAgICAvLyBIb29rIGRvZXNuJ3QgZXhpc3Qg4oCUIHN0YXJ0IGEgbmV3IHdvcmtmbG93IHJ1biBpbnN0ZWFkXG4gKiAgICAgYXdhaXQgc3RhcnRXb3JrZmxvdyhcIm15V29ya2Zsb3dcIiwgcGF5bG9hZCk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgSG9va05vdEZvdW5kRXJyb3IgZXh0ZW5kcyBXb3JrZmxvd0Vycm9yIHtcbiAgdG9rZW46IHN0cmluZztcblxuICBjb25zdHJ1Y3Rvcih0b2tlbjogc3RyaW5nKSB7XG4gICAgc3VwZXIoJ0hvb2sgbm90IGZvdW5kJywge30pO1xuICAgIHRoaXMubmFtZSA9ICdIb29rTm90Rm91bmRFcnJvcic7XG4gICAgdGhpcy50b2tlbiA9IHRva2VuO1xuICB9XG5cbiAgc3RhdGljIGlzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgSG9va05vdEZvdW5kRXJyb3Ige1xuICAgIHJldHVybiBpc0Vycm9yKHZhbHVlKSAmJiB2YWx1ZS5uYW1lID09PSAnSG9va05vdEZvdW5kRXJyb3InO1xuICB9XG59XG5cbi8qKlxuICogVGhyb3duIHdoZW4gYW4gb3BlcmF0aW9uIGNvbmZsaWN0cyB3aXRoIHRoZSBjdXJyZW50IHN0YXRlIG9mIGFuIGVudGl0eS5cbiAqIFRoaXMgaW5jbHVkZXMgYXR0ZW1wdHMgdG8gbW9kaWZ5IGFuIGVudGl0eSBhbHJlYWR5IGluIGEgdGVybWluYWwgc3RhdGUsXG4gKiBjcmVhdGUgYW4gZW50aXR5IHRoYXQgYWxyZWFkeSBleGlzdHMsIG9yIGFueSBvdGhlciA0MDktc3R5bGUgY29uZmxpY3QuXG4gKlxuICogVGhlIHdvcmtmbG93IHJ1bnRpbWUgaGFuZGxlcyB0aGlzIGVycm9yIGF1dG9tYXRpY2FsbHkuIFVzZXJzIGludGVyYWN0aW5nXG4gKiB3aXRoIHdvcmxkIHN0b3JhZ2UgYmFja2VuZHMgZGlyZWN0bHkgbWF5IGVuY291bnRlciBpdC5cbiAqL1xuZXhwb3J0IGNsYXNzIEVudGl0eUNvbmZsaWN0RXJyb3IgZXh0ZW5kcyBXb3JrZmxvd1dvcmxkRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnRW50aXR5Q29uZmxpY3RFcnJvcic7XG4gIH1cblxuICBzdGF0aWMgaXModmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBFbnRpdHlDb25mbGljdEVycm9yIHtcbiAgICByZXR1cm4gaXNFcnJvcih2YWx1ZSkgJiYgdmFsdWUubmFtZSA9PT0gJ0VudGl0eUNvbmZsaWN0RXJyb3InO1xuICB9XG59XG5cbi8qKlxuICogVGhyb3duIHdoZW4gYSBydW4gaXMgbm8gbG9uZ2VyIGF2YWlsYWJsZSDigJQgZWl0aGVyIGJlY2F1c2UgaXQgaGFzIGJlZW5cbiAqIGNsZWFuZWQgdXAsIGV4cGlyZWQsIG9yIGFscmVhZHkgcmVhY2hlZCBhIHRlcm1pbmFsIHN0YXRlIChjb21wbGV0ZWQvZmFpbGVkKS5cbiAqXG4gKiBUaGUgd29ya2Zsb3cgcnVudGltZSBoYW5kbGVzIHRoaXMgZXJyb3IgYXV0b21hdGljYWxseS4gVXNlcnMgaW50ZXJhY3RpbmdcbiAqIHdpdGggd29ybGQgc3RvcmFnZSBiYWNrZW5kcyBkaXJlY3RseSBtYXkgZW5jb3VudGVyIGl0LlxuICovXG5leHBvcnQgY2xhc3MgUnVuRXhwaXJlZEVycm9yIGV4dGVuZHMgV29ya2Zsb3dXb3JsZEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ1J1bkV4cGlyZWRFcnJvcic7XG4gIH1cblxuICBzdGF0aWMgaXModmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBSdW5FeHBpcmVkRXJyb3Ige1xuICAgIHJldHVybiBpc0Vycm9yKHZhbHVlKSAmJiB2YWx1ZS5uYW1lID09PSAnUnVuRXhwaXJlZEVycm9yJztcbiAgfVxufVxuXG4vKipcbiAqIFRocm93biB3aGVuIGFuIG9wZXJhdGlvbiBjYW5ub3QgcHJvY2VlZCBiZWNhdXNlIGEgcmVxdWlyZWQgdGltZXN0YW1wXG4gKiAoZS5nLiByZXRyeUFmdGVyKSBoYXMgbm90IGJlZW4gcmVhY2hlZCB5ZXQuXG4gKlxuICogVGhlIHdvcmtmbG93IHJ1bnRpbWUgaGFuZGxlcyB0aGlzIGVycm9yIGF1dG9tYXRpY2FsbHkuIFVzZXJzIGludGVyYWN0aW5nXG4gKiB3aXRoIHdvcmxkIHN0b3JhZ2UgYmFja2VuZHMgZGlyZWN0bHkgbWF5IGVuY291bnRlciBpdC5cbiAqXG4gKiBAcHJvcGVydHkgcmV0cnlBZnRlciAtIERlbGF5IGluIHNlY29uZHMgYmVmb3JlIHRoZSBvcGVyYXRpb24gY2FuIGJlIHJldHJpZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBUb29FYXJseUVycm9yIGV4dGVuZHMgV29ya2Zsb3dXb3JsZEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBvcHRpb25zPzogeyByZXRyeUFmdGVyPzogbnVtYmVyIH0pIHtcbiAgICBzdXBlcihtZXNzYWdlLCB7IHJldHJ5QWZ0ZXI6IG9wdGlvbnM/LnJldHJ5QWZ0ZXIgfSk7XG4gICAgdGhpcy5uYW1lID0gJ1Rvb0Vhcmx5RXJyb3InO1xuICB9XG5cbiAgc3RhdGljIGlzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgVG9vRWFybHlFcnJvciB7XG4gICAgcmV0dXJuIGlzRXJyb3IodmFsdWUpICYmIHZhbHVlLm5hbWUgPT09ICdUb29FYXJseUVycm9yJztcbiAgfVxufVxuXG4vKipcbiAqIFRocm93biB3aGVuIGEgcmVxdWVzdCBpcyByYXRlIGxpbWl0ZWQgYnkgdGhlIHdvcmtmbG93IGJhY2tlbmQuXG4gKlxuICogVGhlIHdvcmtmbG93IHJ1bnRpbWUgaGFuZGxlcyB0aGlzIGVycm9yIGF1dG9tYXRpY2FsbHkgd2l0aCByZXRyeSBsb2dpYy5cbiAqIFVzZXJzIGludGVyYWN0aW5nIHdpdGggd29ybGQgc3RvcmFnZSBiYWNrZW5kcyBkaXJlY3RseSBtYXkgZW5jb3VudGVyIGl0XG4gKiBpZiByZXRyaWVzIGFyZSBleGhhdXN0ZWQuXG4gKlxuICogQHByb3BlcnR5IHJldHJ5QWZ0ZXIgLSBEZWxheSBpbiBzZWNvbmRzIGJlZm9yZSB0aGUgcmVxdWVzdCBjYW4gYmUgcmV0cmllZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFRocm90dGxlRXJyb3IgZXh0ZW5kcyBXb3JrZmxvd1dvcmxkRXJyb3Ige1xuICByZXRyeUFmdGVyPzogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgb3B0aW9ucz86IHsgcmV0cnlBZnRlcj86IG51bWJlciB9KSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ1Rocm90dGxlRXJyb3InO1xuICAgIHRoaXMucmV0cnlBZnRlciA9IG9wdGlvbnM/LnJldHJ5QWZ0ZXI7XG4gIH1cblxuICBzdGF0aWMgaXModmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBUaHJvdHRsZUVycm9yIHtcbiAgICByZXR1cm4gaXNFcnJvcih2YWx1ZSkgJiYgdmFsdWUubmFtZSA9PT0gJ1Rocm90dGxlRXJyb3InO1xuICB9XG59XG5cbi8qKlxuICogVGhyb3duIHdoZW4gYXdhaXRpbmcgYHJ1bi5yZXR1cm5WYWx1ZWAgb24gYSB3b3JrZmxvdyBydW4gdGhhdCB3YXMgY2FuY2VsbGVkLlxuICpcbiAqIFRoaXMgZXJyb3IgaW5kaWNhdGVzIHRoYXQgdGhlIHdvcmtmbG93IHdhcyBleHBsaWNpdGx5IGNhbmNlbGxlZCAodmlhXG4gKiBgcnVuLmNhbmNlbCgpYCkgYW5kIHdpbGwgbm90IHByb2R1Y2UgYSByZXR1cm4gdmFsdWUuIFlvdSBjYW4gY2hlY2sgZm9yXG4gKiBjYW5jZWxsYXRpb24gYmVmb3JlIGF3YWl0aW5nIHRoZSByZXR1cm4gdmFsdWUgYnkgaW5zcGVjdGluZyBgcnVuLnN0YXR1c2AuXG4gKlxuICogVXNlIHRoZSBzdGF0aWMgYFdvcmtmbG93UnVuQ2FuY2VsbGVkRXJyb3IuaXMoKWAgbWV0aG9kIGZvciB0eXBlLXNhZmVcbiAqIGNoZWNraW5nIGluIGNhdGNoIGJsb2Nrcy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IFdvcmtmbG93UnVuQ2FuY2VsbGVkRXJyb3IgfSBmcm9tIFwid29ya2Zsb3cvaW50ZXJuYWwvZXJyb3JzXCI7XG4gKlxuICogdHJ5IHtcbiAqICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcnVuLnJldHVyblZhbHVlO1xuICogfSBjYXRjaCAoZXJyb3IpIHtcbiAqICAgaWYgKFdvcmtmbG93UnVuQ2FuY2VsbGVkRXJyb3IuaXMoZXJyb3IpKSB7XG4gKiAgICAgY29uc29sZS5sb2coYFJ1biAke2Vycm9yLnJ1bklkfSB3YXMgY2FuY2VsbGVkYCk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgV29ya2Zsb3dSdW5DYW5jZWxsZWRFcnJvciBleHRlbmRzIFdvcmtmbG93RXJyb3Ige1xuICBydW5JZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHJ1bklkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgV29ya2Zsb3cgcnVuIFwiJHtydW5JZH1cIiBjYW5jZWxsZWRgLCB7fSk7XG4gICAgdGhpcy5uYW1lID0gJ1dvcmtmbG93UnVuQ2FuY2VsbGVkRXJyb3InO1xuICAgIHRoaXMucnVuSWQgPSBydW5JZDtcbiAgfVxuXG4gIHN0YXRpYyBpcyh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFdvcmtmbG93UnVuQ2FuY2VsbGVkRXJyb3Ige1xuICAgIHJldHVybiBpc0Vycm9yKHZhbHVlKSAmJiB2YWx1ZS5uYW1lID09PSAnV29ya2Zsb3dSdW5DYW5jZWxsZWRFcnJvcic7XG4gIH1cbn1cblxuLyoqXG4gKiBUaHJvd24gd2hlbiBhdHRlbXB0aW5nIHRvIG9wZXJhdGUgb24gYSB3b3JrZmxvdyBydW4gdGhhdCByZXF1aXJlcyBhIG5ld2VyIFdvcmxkIHZlcnNpb24uXG4gKlxuICogVGhpcyBlcnJvciBvY2N1cnMgd2hlbiBhIHJ1biB3YXMgY3JlYXRlZCB3aXRoIGEgbmV3ZXIgc3BlYyB2ZXJzaW9uIHRoYW4gdGhlXG4gKiBjdXJyZW50IFdvcmxkIGltcGxlbWVudGF0aW9uIHN1cHBvcnRzLiBUbyByZXNvbHZlIHRoaXMsIHVwZ3JhZGUgeW91clxuICogYHdvcmtmbG93YCBwYWNrYWdlcyB0byBhIHZlcnNpb24gdGhhdCBzdXBwb3J0cyB0aGUgcmVxdWlyZWQgc3BlYyB2ZXJzaW9uLlxuICpcbiAqIFVzZSB0aGUgc3RhdGljIGBSdW5Ob3RTdXBwb3J0ZWRFcnJvci5pcygpYCBtZXRob2QgZm9yIHR5cGUtc2FmZSBjaGVja2luZyBpblxuICogY2F0Y2ggYmxvY2tzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgUnVuTm90U3VwcG9ydGVkRXJyb3IgfSBmcm9tIFwid29ya2Zsb3cvaW50ZXJuYWwvZXJyb3JzXCI7XG4gKlxuICogdHJ5IHtcbiAqICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgcnVuLnN0YXR1cztcbiAqIH0gY2F0Y2ggKGVycm9yKSB7XG4gKiAgIGlmIChSdW5Ob3RTdXBwb3J0ZWRFcnJvci5pcyhlcnJvcikpIHtcbiAqICAgICBjb25zb2xlLmVycm9yKFxuICogICAgICAgYFJ1biByZXF1aXJlcyBzcGVjIHYke2Vycm9yLnJ1blNwZWNWZXJzaW9ufSwgYCArXG4gKiAgICAgICBgYnV0IHdvcmxkIHN1cHBvcnRzIHYke2Vycm9yLndvcmxkU3BlY1ZlcnNpb259YFxuICogICAgICk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgUnVuTm90U3VwcG9ydGVkRXJyb3IgZXh0ZW5kcyBXb3JrZmxvd0Vycm9yIHtcbiAgcmVhZG9ubHkgcnVuU3BlY1ZlcnNpb246IG51bWJlcjtcbiAgcmVhZG9ubHkgd29ybGRTcGVjVmVyc2lvbjogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKHJ1blNwZWNWZXJzaW9uOiBudW1iZXIsIHdvcmxkU3BlY1ZlcnNpb246IG51bWJlcikge1xuICAgIHN1cGVyKFxuICAgICAgYFJ1biByZXF1aXJlcyBzcGVjIHZlcnNpb24gJHtydW5TcGVjVmVyc2lvbn0sIGJ1dCB3b3JsZCBzdXBwb3J0cyB2ZXJzaW9uICR7d29ybGRTcGVjVmVyc2lvbn0uIGAgK1xuICAgICAgICBgUGxlYXNlIHVwZ3JhZGUgJ3dvcmtmbG93JyBwYWNrYWdlLmBcbiAgICApO1xuICAgIHRoaXMubmFtZSA9ICdSdW5Ob3RTdXBwb3J0ZWRFcnJvcic7XG4gICAgdGhpcy5ydW5TcGVjVmVyc2lvbiA9IHJ1blNwZWNWZXJzaW9uO1xuICAgIHRoaXMud29ybGRTcGVjVmVyc2lvbiA9IHdvcmxkU3BlY1ZlcnNpb247XG4gIH1cblxuICBzdGF0aWMgaXModmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBSdW5Ob3RTdXBwb3J0ZWRFcnJvciB7XG4gICAgcmV0dXJuIGlzRXJyb3IodmFsdWUpICYmIHZhbHVlLm5hbWUgPT09ICdSdW5Ob3RTdXBwb3J0ZWRFcnJvcic7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGZhdGFsIGVycm9yIGlzIGFuIGVycm9yIHRoYXQgY2Fubm90IGJlIHJldHJpZWQuXG4gKiBJdCB3aWxsIGNhdXNlIHRoZSBzdGVwIHRvIGZhaWwgYW5kIHRoZSBlcnJvciB3aWxsXG4gKiBiZSBidWJibGVkIHVwIHRvIHRoZSB3b3JrZmxvdyBsb2dpYy5cbiAqL1xuZXhwb3J0IGNsYXNzIEZhdGFsRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGZhdGFsID0gdHJ1ZTtcblxuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnRmF0YWxFcnJvcic7XG4gIH1cblxuICBzdGF0aWMgaXModmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBGYXRhbEVycm9yIHtcbiAgICByZXR1cm4gaXNFcnJvcih2YWx1ZSkgJiYgdmFsdWUubmFtZSA9PT0gJ0ZhdGFsRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmV0cnlhYmxlRXJyb3JPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmVmb3JlIHJldHJ5aW5nIHRoZSBzdGVwLlxuICAgKiBDYW4gYWxzbyBiZSBhIGR1cmF0aW9uIHN0cmluZyAoZS5nLiwgXCI1c1wiLCBcIjJtXCIpIG9yIGEgRGF0ZSBvYmplY3QuXG4gICAqIElmIG5vdCBwcm92aWRlZCwgdGhlIHN0ZXAgd2lsbCBiZSByZXRyaWVkIGFmdGVyIDEgc2Vjb25kICgxMDAwIG1pbGxpc2Vjb25kcykuXG4gICAqL1xuICByZXRyeUFmdGVyPzogbnVtYmVyIHwgU3RyaW5nVmFsdWUgfCBEYXRlO1xufVxuXG4vKipcbiAqIEFuIGVycm9yIHRoYXQgY2FuIGhhcHBlbiBkdXJpbmcgYSBzdGVwIGV4ZWN1dGlvbiwgYWxsb3dpbmdcbiAqIGZvciBjb25maWd1cmF0aW9uIG9mIHRoZSByZXRyeSBiZWhhdmlvci5cbiAqL1xuZXhwb3J0IGNsYXNzIFJldHJ5YWJsZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAvKipcbiAgICogVGhlIERhdGUgd2hlbiB0aGUgc3RlcCBzaG91bGQgYmUgcmV0cmllZC5cbiAgICovXG4gIHJldHJ5QWZ0ZXI6IERhdGU7XG5cbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBvcHRpb25zOiBSZXRyeWFibGVFcnJvck9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdSZXRyeWFibGVFcnJvcic7XG5cbiAgICBpZiAob3B0aW9ucy5yZXRyeUFmdGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucmV0cnlBZnRlciA9IHBhcnNlRHVyYXRpb25Ub0RhdGUob3B0aW9ucy5yZXRyeUFmdGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVmYXVsdCB0byAxIHNlY29uZCAoMTAwMCBtaWxsaXNlY29uZHMpXG4gICAgICB0aGlzLnJldHJ5QWZ0ZXIgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgMTAwMCk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGlzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmV0cnlhYmxlRXJyb3Ige1xuICAgIHJldHVybiBpc0Vycm9yKHZhbHVlKSAmJiB2YWx1ZS5uYW1lID09PSAnUmV0cnlhYmxlRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBWRVJDRUxfNDAzX0VSUk9SX01FU1NBR0UgPVxuICAnWW91ciBjdXJyZW50IHZlcmNlbCBhY2NvdW50IGRvZXMgbm90IGhhdmUgYWNjZXNzIHRvIHRoaXMgcmVzb3VyY2UuIFVzZSBgdmVyY2VsIGxvZ2luYCBvciBgdmVyY2VsIHN3aXRjaGAgdG8gZW5zdXJlIHlvdSBhcmUgbGlua2VkIHRvIHRoZSByaWdodCBhY2NvdW50Lic7XG5cbmV4cG9ydCB7IFJVTl9FUlJPUl9DT0RFUywgdHlwZSBSdW5FcnJvckNvZGUgfSBmcm9tICcuL2Vycm9yLWNvZGVzLmpzJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDcm9zcy1yZWFsbSBjbGFzcyByZWdpc3RyYXRpb25cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy9cbi8vIGBGYXRhbEVycm9yYCwgYFJldHJ5YWJsZUVycm9yYCwgYW5kIGBIb29rQ29uZmxpY3RFcnJvcmAgYXJlIG5vdCBidWlsdC1pbnMsIHNvIGRpZmZlcmVudCByZWFsbXNcbi8vIChlLmcuIHRoZSB3b3JrZmxvdyBWTSBjb250ZXh0IHZzLiB0aGUgaG9zdCBjb250ZXh0IHRoYXQgcnVucyB0aGUgcXVldWVcbi8vIGhhbmRsZXIpIGJ1bmRsZSBhbmQgbG9hZCB0aGVpciBvd24gY29waWVzIG9mIHRoaXMgbW9kdWxlIOKAlCBtZWFuaW5nIGVhY2hcbi8vIHJlYWxtIGhhcyBpdHMgb3duIGRpc3RpbmN0IGNsYXNzIGlkZW50aXR5LiBDcm9zcy1yZWFsbSBgaW5zdGFuY2VvZmAgZmFpbHNcbi8vIGJlY2F1c2UgdGhlIHByb3RvdHlwZSBjaGFpbnMgbmV2ZXIgbWVldC5cbi8vXG4vLyBUbyBsZXQgc2VyaWFsaXphdGlvbiByZXZpdmVycyByZWNvbnN0cnVjdCBhIHZhbHVlIGFzIHRoZSAqY29uc3VtZXIncypcbi8vIEZhdGFsRXJyb3IgKHNvIHVzZXItY29kZSBgZXJyIGluc3RhbmNlb2YgRmF0YWxFcnJvcmAgcGFzc2VzKSwgZWFjaCBidW5kbGVkXG4vLyBjb3B5IG9mIHRoaXMgbW9kdWxlIHNlbGYtcmVnaXN0ZXJzIGl0cyBjbGFzcyBvbiBgZ2xvYmFsVGhpc2AgdmlhIGEga25vd25cbi8vIFN5bWJvbC5mb3Iga2V5LiBSZXZpdmVycyBpbiBgQHdvcmtmbG93L2NvcmVgIGxvb2sgdXAgdGhlIGNsYXNzIHZpYSB0aGVcbi8vIGNvbnN1bWVyJ3MgZ2xvYmFsVGhpcyBhdCBoeWRyYXRpb24gdGltZS5cbi8vXG4vLyBGaXJzdCByZWdpc3RyYXRpb24gaW4gYSBnaXZlbiByZWFsbSB3aW5zLiBUaGUgZGVzY3JpcHRvciBpcyBub24td3JpdGFibGVcbi8vIGFuZCBub24tY29uZmlndXJhYmxlIHRvIG1ha2UgYWNjaWRlbnRhbCBjbG9iYmVyaW5nIGxvdWQuXG5jb25zdCBGQVRBTF9FUlJPUl9LRVkgPSBTeW1ib2wuZm9yKCdAd29ya2Zsb3cvZXJyb3JzLy9GYXRhbEVycm9yJyk7XG5jb25zdCBSRVRSWUFCTEVfRVJST1JfS0VZID0gU3ltYm9sLmZvcignQHdvcmtmbG93L2Vycm9ycy8vUmV0cnlhYmxlRXJyb3InKTtcbmNvbnN0IEhPT0tfQ09ORkxJQ1RfRVJST1JfS0VZID0gU3ltYm9sLmZvcihcbiAgJ0B3b3JrZmxvdy9lcnJvcnMvL0hvb2tDb25mbGljdEVycm9yJ1xuKTtcblxuaWYgKHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJykge1xuICBpZiAoIU9iamVjdC5oYXNPd24oZ2xvYmFsVGhpcywgRkFUQUxfRVJST1JfS0VZKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShnbG9iYWxUaGlzLCBGQVRBTF9FUlJPUl9LRVksIHtcbiAgICAgIHZhbHVlOiBGYXRhbEVycm9yLFxuICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIH0pO1xuICB9XG4gIGlmICghT2JqZWN0Lmhhc093bihnbG9iYWxUaGlzLCBSRVRSWUFCTEVfRVJST1JfS0VZKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShnbG9iYWxUaGlzLCBSRVRSWUFCTEVfRVJST1JfS0VZLCB7XG4gICAgICB2YWx1ZTogUmV0cnlhYmxlRXJyb3IsXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgfSk7XG4gIH1cbiAgaWYgKCFPYmplY3QuaGFzT3duKGdsb2JhbFRoaXMsIEhPT0tfQ09ORkxJQ1RfRVJST1JfS0VZKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShnbG9iYWxUaGlzLCBIT09LX0NPTkZMSUNUX0VSUk9SX0tFWSwge1xuICAgICAgdmFsdWU6IEhvb2tDb25mbGljdEVycm9yLFxuICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIH0pO1xuICB9XG59XG4iLCAiZXhwb3J0IGNvbnN0IFdPUktGTE9XX1VTRV9TVEVQID0gU3ltYm9sLmZvcignV09SS0ZMT1dfVVNFX1NURVAnKTtcbmV4cG9ydCBjb25zdCBXT1JLRkxPV19DUkVBVEVfSE9PSyA9IFN5bWJvbC5mb3IoJ1dPUktGTE9XX0NSRUFURV9IT09LJyk7XG5leHBvcnQgY29uc3QgV09SS0ZMT1dfU0xFRVAgPSBTeW1ib2wuZm9yKCdXT1JLRkxPV19TTEVFUCcpO1xuZXhwb3J0IGNvbnN0IFdPUktGTE9XX0NPTlRFWFQgPSBTeW1ib2wuZm9yKCdXT1JLRkxPV19DT05URVhUJyk7XG5leHBvcnQgY29uc3QgV09SS0ZMT1dfR0VUX1NUUkVBTV9JRCA9IFN5bWJvbC5mb3IoJ1dPUktGTE9XX0dFVF9TVFJFQU1fSUQnKTtcbmV4cG9ydCBjb25zdCBTVEFCTEVfVUxJRCA9IFN5bWJvbC5mb3IoJ1dPUktGTE9XX1NUQUJMRV9VTElEJyk7XG5leHBvcnQgY29uc3QgU1RSRUFNX05BTUVfU1lNQk9MID0gU3ltYm9sLmZvcignV09SS0ZMT1dfU1RSRUFNX05BTUUnKTtcbmV4cG9ydCBjb25zdCBTVFJFQU1fVFlQRV9TWU1CT0wgPSBTeW1ib2wuZm9yKCdXT1JLRkxPV19TVFJFQU1fVFlQRScpO1xuZXhwb3J0IGNvbnN0IFNUUkVBTV9GUkFNSU5HX1NZTUJPTCA9IFN5bWJvbC5mb3IoJ1dPUktGTE9XX1NUUkVBTV9GUkFNSU5HJyk7XG4vKipcbiAqIFN0YW1wZWQgb24gYSByZWFsIGBXcml0YWJsZVN0cmVhbWAgKHRoZSB1c2VyLXZpc2libGUgYHNlcmlhbGl6ZS53cml0YWJsZWBcbiAqIHJldHVybmVkIGZyb20gYSBzdGVwLXNpZGUgcmV2aXZlciBvciBzdGVwLWNvbnRleHQgYGdldFdyaXRhYmxlKClgKSB0b1xuICogcmVjb3JkIHRoZSBgcnVuSWRgIG9mIHRoZSB3b3JrZmxvdyBydW4gdGhhdCBvd25zIHRoZSB1bmRlcmx5aW5nIHNlcnZlclxuICogc3RyZWFtLiBVc2VkIHRvZ2V0aGVyIHdpdGggYFNUUkVBTV9OQU1FX1NZTUJPTGAuXG4gKlxuICogV2hlbiBgZ2V0RXh0ZXJuYWxSZWR1Y2Vycy5Xcml0YWJsZVN0cmVhbWAgKHRoZSBkZWh5ZHJhdGlvbiBwYXRoIHVzZWQgYnlcbiAqIGBzdGFydCgpYCkgc2VlcyBib3RoIHN5bWJvbHMgb24gYSB3cml0YWJsZSwgaXQgaW5jbHVkZXMgdGhlIGBydW5JZGAgaW5cbiAqIHRoZSBkZXNjcmlwdG9yIGl0IGVtaXRzLiBUaGUgY2hpbGQgcnVuJ3Mgc3RlcC1zaWRlIHJldml2ZXIgdGhlbiBvcGVuc1xuICogYSBzZXJ2ZXIgd3JpdGFibGUgYWdhaW5zdCB0aGUgb3JpZ2luYWwgYChydW5JZCwgbmFtZSlgIGFuZCByZXNvbHZlc1xuICogdGhhdCBydW4ncyBlbmNyeXB0aW9uIGtleSBkaXJlY3RseSDigJQgc28gdGhlIGNoaWxkJ3Mgd3JpdGVzIGxhbmQgb25cbiAqIHRoZSBwYXJlbnQncyBzdHJlYW0gYXMtaXMsIHdpdGggbm8gY2xpZW50IHByb2Nlc3MgaW4gdGhlIGxvb3AuIFRoYXRcbiAqIGtlZXBzIHRoZSBmb3J3YXJkaW5nIGFsaXZlIGZvciB0aGUgZnVsbCBsaWZldGltZSBvZiB0aGUgY2hpbGQgcnVuLFxuICogbm90IGp1c3QgZm9yIHRoZSBwYXJlbnQgc3RlcCB0aGF0IGluaXRpYXRlZCBgc3RhcnQoKWAuXG4gKi9cbmV4cG9ydCBjb25zdCBTVFJFQU1fU0VSVkVSX1JVTl9JRF9TWU1CT0wgPSBTeW1ib2wuZm9yKFxuICAnV09SS0ZMT1dfU1RSRUFNX1NFUlZFUl9SVU5fSUQnXG4pO1xuLyoqXG4gKiBTdGFtcGVkIGFsb25nc2lkZSBgU1RSRUFNX1NFUlZFUl9SVU5fSURfU1lNQk9MYCB3aGVuIHRoZSBkZXBsb3ltZW50IHRoYXRcbiAqIG93bnMgYSBmb3J3YXJkZWQgd3JpdGFibGUgc3RyZWFtIGlzIGtub3duLiBDcm9zcy1kZXBsb3ltZW50IGNvbnN1bWVycyB1c2VcbiAqIGl0IHRvIHJlc29sdmUgdGhlIG93bmluZyBydW4ncyBlbmNyeXB0aW9uIGtleSB3aXRob3V0IGxvYWRpbmcgdGhlIHJ1biBmaXJzdC5cbiAqL1xuZXhwb3J0IGNvbnN0IFNUUkVBTV9TRVJWRVJfREVQTE9ZTUVOVF9JRF9TWU1CT0wgPSBTeW1ib2wuZm9yKFxuICAnV09SS0ZMT1dfU1RSRUFNX1NFUlZFUl9ERVBMT1lNRU5UX0lEJ1xuKTtcbmV4cG9ydCBjb25zdCBCT0RZX0lOSVRfU1lNQk9MID0gU3ltYm9sLmZvcignQk9EWV9JTklUJyk7XG5leHBvcnQgY29uc3QgV0VCSE9PS19SRVNQT05TRV9XUklUQUJMRSA9IFN5bWJvbC5mb3IoXG4gICdXRUJIT09LX1JFU1BPTlNFX1dSSVRBQkxFJ1xuKTtcblxuLyoqXG4gKiBTeW1ib2wgdXNlZCB0byBzdG9yZSB0aGUgY2xhc3MgcmVnaXN0cnkgb24gZ2xvYmFsVGhpcyBpbiB3b3JrZmxvdyBtb2RlLlxuICogVGhpcyBhbGxvd3MgdGhlIGRlc2VyaWFsaXplciB0byBmaW5kIGNsYXNzZXMgYnkgY2xhc3NJZCBpbiB0aGUgVk0gY29udGV4dC5cbiAqL1xuZXhwb3J0IGNvbnN0IFdPUktGTE9XX0NMQVNTX1JFR0lTVFJZID0gU3ltYm9sLmZvcignd29ya2Zsb3ctY2xhc3MtcmVnaXN0cnknKTtcbiIsICJpbXBvcnQgdHlwZSB7IFN0cmluZ1ZhbHVlIH0gZnJvbSAnbXMnO1xuaW1wb3J0IHsgV09SS0ZMT1dfU0xFRVAgfSBmcm9tICcuL3N5bWJvbHMuanMnO1xuXG4vKipcbiAqIFNsZWVwIHdpdGhpbiBhIHdvcmtmbG93IGZvciBhIGdpdmVuIGR1cmF0aW9uLlxuICpcbiAqIFRoaXMgaXMgYSBidWlsdC1pbiBydW50aW1lIGZ1bmN0aW9uIHRoYXQgdXNlcyB0aW1lciBldmVudHMgaW4gdGhlIGV2ZW50IGxvZy5cbiAqXG4gKiBAcGFyYW0gZHVyYXRpb24gLSBUaGUgZHVyYXRpb24gdG8gc2xlZXAgZm9yLCB0aGlzIGlzIGEgc3RyaW5nIGluIHRoZSBmb3JtYXRcbiAqIG9mIGBcIjEwMDBtc1wiYCwgYFwiMXNcImAsIGBcIjFtXCJgLCBgXCIxaFwiYCwgb3IgYFwiMWRcImAuXG4gKiBAb3ZlcmxvYWRcbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHNsZWVwIGlzIGNvbXBsZXRlLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2xlZXAoZHVyYXRpb246IFN0cmluZ1ZhbHVlKTogUHJvbWlzZTx2b2lkPjtcblxuLyoqXG4gKiBTbGVlcCB3aXRoaW4gYSB3b3JrZmxvdyB1bnRpbCBhIHNwZWNpZmljIGRhdGUuXG4gKlxuICogVGhpcyBpcyBhIGJ1aWx0LWluIHJ1bnRpbWUgZnVuY3Rpb24gdGhhdCB1c2VzIHRpbWVyIGV2ZW50cyBpbiB0aGUgZXZlbnQgbG9nLlxuICpcbiAqIEBwYXJhbSBkYXRlIC0gVGhlIGRhdGUgdG8gc2xlZXAgdW50aWwsIHRoaXMgbXVzdCBiZSBhIGZ1dHVyZSBkYXRlLlxuICogQG92ZXJsb2FkXG4gKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBzbGVlcCBpcyBjb21wbGV0ZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNsZWVwKGRhdGU6IERhdGUpOiBQcm9taXNlPHZvaWQ+O1xuXG4vKipcbiAqIFNsZWVwIHdpdGhpbiBhIHdvcmtmbG93IGZvciBhIGdpdmVuIGR1cmF0aW9uIGluIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBUaGlzIGlzIGEgYnVpbHQtaW4gcnVudGltZSBmdW5jdGlvbiB0aGF0IHVzZXMgdGltZXIgZXZlbnRzIGluIHRoZSBldmVudCBsb2cuXG4gKlxuICogQHBhcmFtIGR1cmF0aW9uTXMgLSBUaGUgZHVyYXRpb24gdG8gc2xlZXAgZm9yIGluIG1pbGxpc2Vjb25kcy5cbiAqIEBvdmVybG9hZFxuICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgc2xlZXAgaXMgY29tcGxldGUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzbGVlcChkdXJhdGlvbk1zOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2xlZXAocGFyYW06IFN0cmluZ1ZhbHVlIHwgRGF0ZSB8IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAvLyBJbnNpZGUgdGhlIHdvcmtmbG93IFZNLCB0aGUgc2xlZXAgZnVuY3Rpb24gaXMgc3RvcmVkIGluIHRoZSBnbG9iYWxUaGlzIG9iamVjdCBiZWhpbmQgYSBzeW1ib2xcbiAgY29uc3Qgc2xlZXBGbiA9IChnbG9iYWxUaGlzIGFzIGFueSlbV09SS0ZMT1dfU0xFRVBdO1xuICBpZiAoIXNsZWVwRm4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2BzbGVlcCgpYCBjYW4gb25seSBiZSBjYWxsZWQgaW5zaWRlIGEgd29ya2Zsb3cgZnVuY3Rpb24nKTtcbiAgfVxuICByZXR1cm4gc2xlZXBGbihwYXJhbSk7XG59XG4iLCAiLyoqXG4gKiBUaGlzIGlzIHRoZSBcInN0YW5kYXJkIGxpYnJhcnlcIiBvZiBzdGVwcyB0aGF0IHdlIG1ha2UgYXZhaWxhYmxlIHRvIGFsbCB3b3JrZmxvdyB1c2Vycy5cbiAqIFRoZSBjYW4gYmUgaW1wb3J0ZWQgbGlrZSBzbzogYGltcG9ydCB7IGZldGNoIH0gZnJvbSAnd29ya2Zsb3cnYC4gYW5kIHVzZWQgaW4gd29ya2Zsb3cuXG4gKiBUaGUgbmVlZCB0byBiZSBleHBvcnRlZCBkaXJlY3RseSBpbiB0aGlzIHBhY2thZ2UgYW5kIGNhbm5vdCBsaXZlIGluIGBjb3JlYCB0byBwcmV2ZW50XG4gKiBjaXJjdWxhciBkZXBlbmRlbmNpZXMgcG9zdC1jb21waWxhdGlvbi5cbiAqL1xuXG4vKipcbiAqIEEgaG9pc3RlZCBgZmV0Y2goKWAgZnVuY3Rpb24gdGhhdCBpcyBleGVjdXRlZCBhcyBhIFwic3RlcFwiIGZ1bmN0aW9uLFxuICogZm9yIHVzZSB3aXRoaW4gd29ya2Zsb3cgZnVuY3Rpb25zLlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0ZldGNoX0FQSVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2goLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgZ2xvYmFsVGhpcy5mZXRjaD4pIHtcbiAgJ3VzZSBzdGVwJztcbiAgcmV0dXJuIGdsb2JhbFRoaXMuZmV0Y2goLi4uYXJncyk7XG59XG4iLCAiaW1wb3J0IHsgc2xlZXAgfSBmcm9tIFwid29ya2Zsb3dcIjtcbi8qKl9faW50ZXJuYWxfd29ya2Zsb3dze1wid29ya2Zsb3dzXCI6e1wiYXBwL3dvcmtmbG93cy9zaWdudXAudHNcIjp7XCJoYW5kbGVVc2VyU2lnbnVwXCI6e1wid29ya2Zsb3dJZFwiOlwid29ya2Zsb3cvLy4vYXBwL3dvcmtmbG93cy9zaWdudXAvL2hhbmRsZVVzZXJTaWdudXBcIn19fSxcInN0ZXBzXCI6e1wiYXBwL3dvcmtmbG93cy9zaWdudXAudHNcIjp7XCJjcmVhdGVVc2VyXCI6e1wic3RlcElkXCI6XCJzdGVwLy8uL2FwcC93b3JrZmxvd3Mvc2lnbnVwLy9jcmVhdGVVc2VyXCJ9LFwic2VuZE9uYm9hcmRpbmdFbWFpbFwiOntcInN0ZXBJZFwiOlwic3RlcC8vLi9hcHAvd29ya2Zsb3dzL3NpZ251cC8vc2VuZE9uYm9hcmRpbmdFbWFpbFwifSxcInNlbmRXZWxjb21lRW1haWxcIjp7XCJzdGVwSWRcIjpcInN0ZXAvLy4vYXBwL3dvcmtmbG93cy9zaWdudXAvL3NlbmRXZWxjb21lRW1haWxcIn19fX0qLztcbi8vIER1cmFibGUgd29ya2Zsb3cgc3RlcHNcbnZhciBjcmVhdGVVc2VyID0gZ2xvYmFsVGhpc1tTeW1ib2wuZm9yKFwiV09SS0ZMT1dfVVNFX1NURVBcIildKFwic3RlcC8vLi9hcHAvd29ya2Zsb3dzL3NpZ251cC8vY3JlYXRlVXNlclwiKTtcbnZhciBzZW5kV2VsY29tZUVtYWlsID0gZ2xvYmFsVGhpc1tTeW1ib2wuZm9yKFwiV09SS0ZMT1dfVVNFX1NURVBcIildKFwic3RlcC8vLi9hcHAvd29ya2Zsb3dzL3NpZ251cC8vc2VuZFdlbGNvbWVFbWFpbFwiKTtcbnZhciBzZW5kT25ib2FyZGluZ0VtYWlsID0gZ2xvYmFsVGhpc1tTeW1ib2wuZm9yKFwiV09SS0ZMT1dfVVNFX1NURVBcIildKFwic3RlcC8vLi9hcHAvd29ya2Zsb3dzL3NpZ251cC8vc2VuZE9uYm9hcmRpbmdFbWFpbFwiKTtcbi8qKlxuICogT3JjaGVzdHJhdGVzIHRoZSBkdXJhYmxlIHVzZXIgb25ib2FyZGluZyBwcm9jZXNzXG4gKi8gZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVVzZXJTaWdudXAoZW1haWwpIHtcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgY3JlYXRlVXNlcihlbWFpbCk7XG4gICAgYXdhaXQgc2VuZFdlbGNvbWVFbWFpbCh1c2VyKTtcbiAgICAvLyBEdXJhYmxlIG5vbi1ibG9ja2luZyBzbGVlcCAoc3Vydml2ZXMgcmVzdGFydHMvZGVwbG95bWVudHMpXG4gICAgYXdhaXQgc2xlZXAoXCI1c1wiKTtcbiAgICBhd2FpdCBzZW5kT25ib2FyZGluZ0VtYWlsKHVzZXIpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHVzZXJJZDogdXNlci5pZCxcbiAgICAgICAgc3RhdHVzOiBcIm9uYm9hcmRlZFwiXG4gICAgfTtcbn1cbmhhbmRsZVVzZXJTaWdudXAud29ya2Zsb3dJZCA9IFwid29ya2Zsb3cvLy4vYXBwL3dvcmtmbG93cy9zaWdudXAvL2hhbmRsZVVzZXJTaWdudXBcIjtcbmdsb2JhbFRoaXMuX19wcml2YXRlX3dvcmtmbG93cy5zZXQoXCJ3b3JrZmxvdy8vLi9hcHAvd29ya2Zsb3dzL3NpZ251cC8vaGFuZGxlVXNlclNpZ251cFwiLCBoYW5kbGVVc2VyU2lnbnVwKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBLHNDQUFBQSxTQUFBO0FBQUE7QUFFSSxRQUFJLElBQUk7QUFDWixRQUFJLElBQUksSUFBSTtBQUNaLFFBQUksSUFBSSxJQUFJO0FBQ1osUUFBSSxJQUFJLElBQUk7QUFDWixRQUFJLElBQUksSUFBSTtBQUNaLFFBQUksSUFBSSxJQUFJO0FBYVIsSUFBQUEsUUFBTyxVQUFVLFNBQVMsS0FBSyxTQUFTO0FBQ3hDLGdCQUFVLFdBQVcsQ0FBQztBQUN0QixVQUFJLE9BQU8sT0FBTztBQUNsQixVQUFJLFNBQVMsWUFBWSxJQUFJLFNBQVMsR0FBRztBQUNyQyxlQUFPLE1BQU0sR0FBRztBQUFBLE1BQ3BCLFdBQVcsU0FBUyxZQUFZLFNBQVMsR0FBRyxHQUFHO0FBQzNDLGVBQU8sUUFBUSxPQUFPLFFBQVEsR0FBRyxJQUFJLFNBQVMsR0FBRztBQUFBLE1BQ3JEO0FBQ0EsWUFBTSxJQUFJLE1BQU0sMERBQTBELEtBQUssVUFBVSxHQUFHLENBQUM7QUFBQSxJQUNqRztBQU9JLGFBQVMsTUFBTSxLQUFLO0FBQ3BCLFlBQU0sT0FBTyxHQUFHO0FBQ2hCLFVBQUksSUFBSSxTQUFTLEtBQUs7QUFDbEI7QUFBQSxNQUNKO0FBQ0EsVUFBSSxRQUFRLG1JQUFtSSxLQUFLLEdBQUc7QUFDdkosVUFBSSxDQUFDLE9BQU87QUFDUjtBQUFBLE1BQ0o7QUFDQSxVQUFJLElBQUksV0FBVyxNQUFNLENBQUMsQ0FBQztBQUMzQixVQUFJLFFBQVEsTUFBTSxDQUFDLEtBQUssTUFBTSxZQUFZO0FBQzFDLGNBQU8sTUFBSztBQUFBLFFBQ1IsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUNELGlCQUFPLElBQUk7QUFBQSxRQUNmLEtBQUs7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
`;

const handler = workflowEntrypoint(workflowCode);

export const HEAD = handler;
export const POST = handler;