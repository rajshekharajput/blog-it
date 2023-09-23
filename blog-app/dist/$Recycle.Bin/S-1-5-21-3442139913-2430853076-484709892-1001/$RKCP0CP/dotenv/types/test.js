"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const env = (0, dotenv_1.config)();
const dbUrl = env.error || !env.parsed ? null : env.parsed["BASIC"];
(0, dotenv_1.config)({
    path: ".env-example",
    encoding: "utf8",
    debug: true
});
const parsed = (0, dotenv_1.parse)("NODE_ENV=production\nDB_HOST=a.b.c");
const dbHost = parsed["DB_HOST"];
const parsedFromBuffer = (0, dotenv_1.parse)(new Buffer("JUSTICE=league\n"), {
    debug: true
});
const justice = parsedFromBuffer["JUSTICE"];
//# sourceMappingURL=test.js.map