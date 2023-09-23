"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = exports.parseLsFiles = exports.parseLsTree = exports.parseGitCommits = exports.parseGitmodules = exports.GitStatusParser = exports.Git = exports.GitError = exports.findGit = void 0;
const fs_1 = require("fs");
const path = require("path");
const os = require("os");
const cp = require("child_process");
const which = require("which");
const events_1 = require("events");
const iconv = require("iconv-lite-umd");
const filetype = require("file-type");
const util_1 = require("./util");
const vscode_1 = require("vscode");
const encoding_1 = require("./encoding");
const byline = require("byline");
const string_decoder_1 = require("string_decoder");
const MAX_CLI_LENGTH = 30000;
const isWindows = process.platform === 'win32';
function parseVersion(raw) {
    return raw.replace(/^git version /, '');
}
function findSpecificGit(path, onLookup) {
    return new Promise((c, e) => {
        onLookup(path);
        const buffers = [];
        const child = cp.spawn(path, ['--version']);
        child.stdout.on('data', (b) => buffers.push(b));
        child.on('error', cpErrorHandler(e));
        child.on('exit', code => code ? e(new Error('Not found')) : c({ path, version: parseVersion(Buffer.concat(buffers).toString('utf8').trim()) }));
    });
}
function findGitDarwin(onLookup) {
    return new Promise((c, e) => {
        cp.exec('which git', (err, gitPathBuffer) => {
            if (err) {
                return e('git not found');
            }
            const path = gitPathBuffer.toString().replace(/^\s+|\s+$/g, '');
            function getVersion(path) {
                onLookup(path);
                cp.exec('git --version', (err, stdout) => {
                    if (err) {
                        return e('git not found');
                    }
                    return c({ path, version: parseVersion(stdout.trim()) });
                });
            }
            if (path !== '/usr/bin/git') {
                return getVersion(path);
            }
            cp.exec('xcode-select -p', (err) => {
                if (err && err.code === 2) {
                    return e('git not found');
                }
                getVersion(path);
            });
        });
    });
}
function findSystemGitWin32(base, onLookup) {
    if (!base) {
        return Promise.reject('Not found');
    }
    return findSpecificGit(path.join(base, 'Git', 'cmd', 'git.exe'), onLookup);
}
function findGitWin32InPath(onLookup) {
    const whichPromise = new Promise((c, e) => which('git.exe', (err, path) => err ? e(err) : c(path)));
    return whichPromise.then(path => findSpecificGit(path, onLookup));
}
function findGitWin32(onLookup) {
    return findSystemGitWin32(process.env['ProgramW6432'], onLookup)
        .then(undefined, () => findSystemGitWin32(process.env['ProgramFiles(x86)'], onLookup))
        .then(undefined, () => findSystemGitWin32(process.env['ProgramFiles'], onLookup))
        .then(undefined, () => findSystemGitWin32(path.join(process.env['LocalAppData'], 'Programs'), onLookup))
        .then(undefined, () => findGitWin32InPath(onLookup));
}
async function findGit(hint, onLookup) {
    const hints = Array.isArray(hint) ? hint : hint ? [hint] : [];
    for (const hint of hints) {
        try {
            return await findSpecificGit(hint, onLookup);
        }
        catch (_a) {
        }
    }
    try {
        switch (process.platform) {
            case 'darwin': return await findGitDarwin(onLookup);
            case 'win32': return await findGitWin32(onLookup);
            default: return await findSpecificGit('git', onLookup);
        }
    }
    catch (_b) {
    }
    throw new Error('Git installation not found.');
}
exports.findGit = findGit;
function cpErrorHandler(cb) {
    return err => {
        if (/ENOENT/.test(err.message)) {
            err = new GitError({
                error: err,
                message: 'Failed to execute git (ENOENT)',
                gitErrorCode: "NotAGitRepository"
            });
        }
        cb(err);
    };
}
async function exec(child, cancellationToken) {
    if (!child.stdout || !child.stderr) {
        throw new GitError({ message: 'Failed to get stdout or stderr from git process.' });
    }
    if (cancellationToken && cancellationToken.isCancellationRequested) {
        throw new GitError({ message: 'Cancelled' });
    }
    const disposables = [];
    const once = (ee, name, fn) => {
        ee.once(name, fn);
        disposables.push((0, util_1.toDisposable)(() => ee.removeListener(name, fn)));
    };
    const on = (ee, name, fn) => {
        ee.on(name, fn);
        disposables.push((0, util_1.toDisposable)(() => ee.removeListener(name, fn)));
    };
    let result = Promise.all([
        new Promise((c, e) => {
            once(child, 'error', cpErrorHandler(e));
            once(child, 'exit', c);
        }),
        new Promise(c => {
            const buffers = [];
            on(child.stdout, 'data', (b) => buffers.push(b));
            once(child.stdout, 'close', () => c(Buffer.concat(buffers)));
        }),
        new Promise(c => {
            const buffers = [];
            on(child.stderr, 'data', (b) => buffers.push(b));
            once(child.stderr, 'close', () => c(Buffer.concat(buffers).toString('utf8')));
        })
    ]);
    if (cancellationToken) {
        const cancellationPromise = new Promise((_, e) => {
            (0, util_1.onceEvent)(cancellationToken.onCancellationRequested)(() => {
                try {
                    child.kill();
                }
                catch (err) {
                }
                e(new GitError({ message: 'Cancelled' }));
            });
        });
        result = Promise.race([result, cancellationPromise]);
    }
    try {
        const [exitCode, stdout, stderr] = await result;
        return { exitCode, stdout, stderr };
    }
    finally {
        (0, util_1.dispose)(disposables);
    }
}
class GitError {
    constructor(data) {
        if (data.error) {
            this.error = data.error;
            this.message = data.error.message;
        }
        else {
            this.error = undefined;
            this.message = '';
        }
        this.message = this.message || data.message || 'Git error';
        this.stdout = data.stdout;
        this.stderr = data.stderr;
        this.exitCode = data.exitCode;
        this.gitErrorCode = data.gitErrorCode;
        this.gitCommand = data.gitCommand;
        this.gitArgs = data.gitArgs;
    }
    toString() {
        let result = this.message + ' ' + JSON.stringify({
            exitCode: this.exitCode,
            gitErrorCode: this.gitErrorCode,
            gitCommand: this.gitCommand,
            stdout: this.stdout,
            stderr: this.stderr
        }, null, 2);
        if (this.error) {
            result += this.error.stack;
        }
        return result;
    }
}
exports.GitError = GitError;
function getGitErrorCode(stderr) {
    if (/Another git process seems to be running in this repository|If no other git process is currently running/.test(stderr)) {
        return "RepositoryIsLocked";
    }
    else if (/Authentication failed/i.test(stderr)) {
        return "AuthenticationFailed";
    }
    else if (/Not a git repository/i.test(stderr)) {
        return "NotAGitRepository";
    }
    else if (/bad config file/.test(stderr)) {
        return "BadConfigFile";
    }
    else if (/cannot make pipe for command substitution|cannot create standard input pipe/.test(stderr)) {
        return "CantCreatePipe";
    }
    else if (/Repository not found/.test(stderr)) {
        return "RepositoryNotFound";
    }
    else if (/unable to access/.test(stderr)) {
        return "CantAccessRemote";
    }
    else if (/branch '.+' is not fully merged/.test(stderr)) {
        return "BranchNotFullyMerged";
    }
    else if (/Couldn\'t find remote ref/.test(stderr)) {
        return "NoRemoteReference";
    }
    else if (/A branch named '.+' already exists/.test(stderr)) {
        return "BranchAlreadyExists";
    }
    else if (/'.+' is not a valid branch name/.test(stderr)) {
        return "InvalidBranchName";
    }
    else if (/Please,? commit your changes or stash them/.test(stderr)) {
        return "DirtyWorkTree";
    }
    return undefined;
}
function sanitizePath(path) {
    return path.replace(/^([a-z]):\\/i, (_, letter) => `${letter.toUpperCase()}:\\`);
}
const COMMIT_FORMAT = '%H%n%aN%n%aE%n%at%n%ct%n%P%n%B';
class Git {
    constructor(options) {
        this._onOutput = new events_1.EventEmitter();
        this.path = options.gitPath;
        this.version = options.version;
        this.userAgent = options.userAgent;
        this.env = options.env || {};
    }
    get onOutput() { return this._onOutput; }
    compareGitVersionTo(version) {
        return util_1.Versions.compare(util_1.Versions.fromString(this.version), util_1.Versions.fromString(version));
    }
    open(repository, dotGit) {
        return new Repository(this, repository, dotGit);
    }
    async init(repository) {
        await this.exec(repository, ['init']);
        return;
    }
    async clone(url, options, cancellationToken) {
        let baseFolderName = decodeURI(url).replace(/[\/]+$/, '').replace(/^.*[\/\\]/, '').replace(/\.git$/, '') || 'repository';
        let folderName = baseFolderName;
        let folderPath = path.join(options.parentPath, folderName);
        let count = 1;
        while (count < 20 && await new Promise(c => (0, fs_1.exists)(folderPath, c))) {
            folderName = `${baseFolderName}-${count++}`;
            folderPath = path.join(options.parentPath, folderName);
        }
        await (0, util_1.mkdirp)(options.parentPath);
        const onSpawn = (child) => {
            const decoder = new string_decoder_1.StringDecoder('utf8');
            const lineStream = new byline.LineStream({ encoding: 'utf8' });
            child.stderr.on('data', (buffer) => lineStream.write(decoder.write(buffer)));
            let totalProgress = 0;
            let previousProgress = 0;
            lineStream.on('data', (line) => {
                let match = null;
                if (match = /Counting objects:\s*(\d+)%/i.exec(line)) {
                    totalProgress = Math.floor(parseInt(match[1]) * 0.1);
                }
                else if (match = /Compressing objects:\s*(\d+)%/i.exec(line)) {
                    totalProgress = 10 + Math.floor(parseInt(match[1]) * 0.1);
                }
                else if (match = /Receiving objects:\s*(\d+)%/i.exec(line)) {
                    totalProgress = 20 + Math.floor(parseInt(match[1]) * 0.4);
                }
                else if (match = /Resolving deltas:\s*(\d+)%/i.exec(line)) {
                    totalProgress = 60 + Math.floor(parseInt(match[1]) * 0.4);
                }
                if (totalProgress !== previousProgress) {
                    options.progress.report({ increment: totalProgress - previousProgress });
                    previousProgress = totalProgress;
                }
            });
        };
        try {
            let command = ['clone', url.includes(' ') ? encodeURI(url) : url, folderPath, '--progress'];
            if (options.recursive) {
                command.push('--recursive');
            }
            await this.exec(options.parentPath, command, {
                cancellationToken,
                env: { 'GIT_HTTP_USER_AGENT': this.userAgent },
                onSpawn,
            });
        }
        catch (err) {
            if (err.stderr) {
                err.stderr = err.stderr.replace(/^Cloning.+$/m, '').trim();
                err.stderr = err.stderr.replace(/^ERROR:\s+/, '').trim();
            }
            throw err;
        }
        return folderPath;
    }
    async getRepositoryRoot(repositoryPath) {
        const result = await this.exec(repositoryPath, ['rev-parse', '--show-toplevel'], { log: false });
        const repoPath = path.normalize(result.stdout.trimLeft().replace(/[\r\n]+$/, ''));
        if (isWindows) {
            const repoUri = vscode_1.Uri.file(repoPath);
            const pathUri = vscode_1.Uri.file(repositoryPath);
            if (repoUri.authority.length !== 0 && pathUri.authority.length === 0) {
                let match = /(?<=^\/?)([a-zA-Z])(?=:\/)/.exec(pathUri.path);
                if (match !== null) {
                    const [, letter] = match;
                    try {
                        const networkPath = await new Promise(resolve => fs_1.realpath.native(`${letter}:\\`, { encoding: 'utf8' }, (err, resolvedPath) => resolve(err !== null ? undefined : resolvedPath)));
                        if (networkPath !== undefined) {
                            return path.normalize(repoUri.fsPath.replace(networkPath, `${letter.toLowerCase()}:${networkPath.endsWith('\\') ? '\\' : ''}`));
                        }
                    }
                    catch (_a) { }
                }
                return path.normalize(pathUri.fsPath);
            }
        }
        return repoPath;
    }
    async getRepositoryDotGit(repositoryPath) {
        const result = await this.exec(repositoryPath, ['rev-parse', '--git-dir']);
        let dotGitPath = result.stdout.trim();
        if (!path.isAbsolute(dotGitPath)) {
            dotGitPath = path.join(repositoryPath, dotGitPath);
        }
        return path.normalize(dotGitPath);
    }
    async exec(cwd, args, options = {}) {
        options = (0, util_1.assign)({ cwd }, options || {});
        return await this._exec(args, options);
    }
    async exec2(args, options = {}) {
        return await this._exec(args, options);
    }
    stream(cwd, args, options = {}) {
        options = (0, util_1.assign)({ cwd }, options || {});
        return this.spawn(args, options);
    }
    async _exec(args, options = {}) {
        const child = this.spawn(args, options);
        if (options.onSpawn) {
            options.onSpawn(child);
        }
        if (options.input) {
            child.stdin.end(options.input, 'utf8');
        }
        const bufferResult = await exec(child, options.cancellationToken);
        if (options.log !== false && bufferResult.stderr.length > 0) {
            this.log(`${bufferResult.stderr}\n`);
        }
        let encoding = options.encoding || 'utf8';
        encoding = iconv.encodingExists(encoding) ? encoding : 'utf8';
        const result = {
            exitCode: bufferResult.exitCode,
            stdout: iconv.decode(bufferResult.stdout, encoding),
            stderr: bufferResult.stderr
        };
        if (bufferResult.exitCode) {
            return Promise.reject(new GitError({
                message: 'Failed to execute git',
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode,
                gitErrorCode: getGitErrorCode(result.stderr),
                gitCommand: args[0],
                gitArgs: args
            }));
        }
        return result;
    }
    spawn(args, options = {}) {
        if (!this.path) {
            throw new Error('git could not be found in the system.');
        }
        if (!options) {
            options = {};
        }
        if (!options.stdio && !options.input) {
            options.stdio = ['ignore', null, null];
        }
        options.env = (0, util_1.assign)({}, process.env, this.env, options.env || {}, {
            VSCODE_GIT_COMMAND: args[0],
            LC_ALL: 'en_US.UTF-8',
            LANG: 'en_US.UTF-8',
            GIT_PAGER: 'cat'
        });
        if (options.cwd) {
            options.cwd = sanitizePath(options.cwd);
        }
        if (options.log !== false) {
            this.log(`> git ${args.join(' ')}\n`);
        }
        return cp.spawn(this.path, args, options);
    }
    log(output) {
        this._onOutput.emit('log', output);
    }
}
exports.Git = Git;
class GitStatusParser {
    constructor() {
        this.lastRaw = '';
        this.result = [];
    }
    get status() {
        return this.result;
    }
    update(raw) {
        let i = 0;
        let nextI;
        raw = this.lastRaw + raw;
        while ((nextI = this.parseEntry(raw, i)) !== undefined) {
            i = nextI;
        }
        this.lastRaw = raw.substr(i);
    }
    parseEntry(raw, i) {
        if (i + 4 >= raw.length) {
            return;
        }
        let lastIndex;
        const entry = {
            x: raw.charAt(i++),
            y: raw.charAt(i++),
            rename: undefined,
            path: ''
        };
        i++;
        if (entry.x === 'R' || entry.x === 'C') {
            lastIndex = raw.indexOf('\0', i);
            if (lastIndex === -1) {
                return;
            }
            entry.rename = raw.substring(i, lastIndex);
            i = lastIndex + 1;
        }
        lastIndex = raw.indexOf('\0', i);
        if (lastIndex === -1) {
            return;
        }
        entry.path = raw.substring(i, lastIndex);
        if (entry.path[entry.path.length - 1] !== '/') {
            this.result.push(entry);
        }
        return lastIndex + 1;
    }
}
exports.GitStatusParser = GitStatusParser;
function parseGitmodules(raw) {
    const regex = /\r?\n/g;
    let position = 0;
    let match = null;
    const result = [];
    let submodule = {};
    function parseLine(line) {
        const sectionMatch = /^\s*\[submodule "([^"]+)"\]\s*$/.exec(line);
        if (sectionMatch) {
            if (submodule.name && submodule.path && submodule.url) {
                result.push(submodule);
            }
            const name = sectionMatch[1];
            if (name) {
                submodule = { name };
                return;
            }
        }
        if (!submodule) {
            return;
        }
        const propertyMatch = /^\s*(\w+)\s*=\s*(.*)$/.exec(line);
        if (!propertyMatch) {
            return;
        }
        const [, key, value] = propertyMatch;
        switch (key) {
            case 'path':
                submodule.path = value;
                break;
            case 'url':
                submodule.url = value;
                break;
        }
    }
    while (match = regex.exec(raw)) {
        parseLine(raw.substring(position, match.index));
        position = match.index + match[0].length;
    }
    parseLine(raw.substring(position));
    if (submodule.name && submodule.path && submodule.url) {
        result.push(submodule);
    }
    return result;
}
exports.parseGitmodules = parseGitmodules;
const commitRegex = /([0-9a-f]{40})\n(.*)\n(.*)\n(.*)\n(.*)\n(.*)(?:\n([^]*?))?(?:\x00)/gm;
function parseGitCommits(data) {
    let commits = [];
    let ref;
    let authorName;
    let authorEmail;
    let authorDate;
    let commitDate;
    let parents;
    let message;
    let match;
    do {
        match = commitRegex.exec(data);
        if (match === null) {
            break;
        }
        [, ref, authorName, authorEmail, authorDate, commitDate, parents, message] = match;
        if (message[message.length - 1] === '\n') {
            message = message.substr(0, message.length - 1);
        }
        commits.push({
            hash: ` ${ref}`.substr(1),
            message: ` ${message}`.substr(1),
            parents: parents ? parents.split(' ') : [],
            authorDate: new Date(Number(authorDate) * 1000),
            authorName: ` ${authorName}`.substr(1),
            authorEmail: ` ${authorEmail}`.substr(1),
            commitDate: new Date(Number(commitDate) * 1000),
        });
    } while (true);
    return commits;
}
exports.parseGitCommits = parseGitCommits;
function parseLsTree(raw) {
    return raw.split('\n')
        .filter(l => !!l)
        .map(line => /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)$/.exec(line))
        .filter(m => !!m)
        .map(([, mode, type, object, size, file]) => ({ mode, type, object, size, file }));
}
exports.parseLsTree = parseLsTree;
function parseLsFiles(raw) {
    return raw.split('\n')
        .filter(l => !!l)
        .map(line => /^(\S+)\s+(\S+)\s+(\S+)\s+(.*)$/.exec(line))
        .filter(m => !!m)
        .map(([, mode, object, stage, file]) => ({ mode, object, stage, file }));
}
exports.parseLsFiles = parseLsFiles;
class Repository {
    constructor(_git, repositoryRoot, dotGit) {
        this._git = _git;
        this.repositoryRoot = repositoryRoot;
        this.dotGit = dotGit;
    }
    get git() {
        return this._git;
    }
    get root() {
        return this.repositoryRoot;
    }
    async exec(args, options = {}) {
        return await this.git.exec(this.repositoryRoot, args, options);
    }
    stream(args, options = {}) {
        return this.git.stream(this.repositoryRoot, args, options);
    }
    spawn(args, options = {}) {
        return this.git.spawn(args, options);
    }
    async config(scope, key, value = null, options = {}) {
        const args = ['config'];
        if (scope) {
            args.push('--' + scope);
        }
        args.push(key);
        if (value) {
            args.push(value);
        }
        const result = await this.exec(args, options);
        return result.stdout.trim();
    }
    async getConfigs(scope) {
        const args = ['config'];
        if (scope) {
            args.push('--' + scope);
        }
        args.push('-l');
        const result = await this.exec(args);
        const lines = result.stdout.trim().split(/\r|\r\n|\n/);
        return lines.map(entry => {
            const equalsIndex = entry.indexOf('=');
            return { key: entry.substr(0, equalsIndex), value: entry.substr(equalsIndex + 1) };
        });
    }
    async log(options) {
        var _a;
        const maxEntries = (_a = options === null || options === void 0 ? void 0 : options.maxEntries) !== null && _a !== void 0 ? _a : 32;
        const args = ['log', `-n${maxEntries}`, `--format=${COMMIT_FORMAT}`, '-z', '--'];
        if (options === null || options === void 0 ? void 0 : options.path) {
            args.push(options.path);
        }
        const result = await this.exec(args);
        if (result.exitCode) {
            return [];
        }
        return parseGitCommits(result.stdout);
    }
    async logFile(uri, options) {
        const args = ['log', `--format=${COMMIT_FORMAT}`, '-z'];
        if ((options === null || options === void 0 ? void 0 : options.maxEntries) && !(options === null || options === void 0 ? void 0 : options.reverse)) {
            args.push(`-n${options.maxEntries}`);
        }
        if (options === null || options === void 0 ? void 0 : options.hash) {
            if (options === null || options === void 0 ? void 0 : options.reverse) {
                args.push('--reverse', '--ancestry-path', `${options.hash}..HEAD`);
            }
            else {
                args.push(options.hash);
            }
        }
        if (options === null || options === void 0 ? void 0 : options.sortByAuthorDate) {
            args.push('--author-date-order');
        }
        args.push('--', uri.fsPath);
        const result = await this.exec(args);
        if (result.exitCode) {
            return [];
        }
        return parseGitCommits(result.stdout);
    }
    async bufferString(object, encoding = 'utf8', autoGuessEncoding = false) {
        const stdout = await this.buffer(object);
        if (autoGuessEncoding) {
            encoding = (0, encoding_1.detectEncoding)(stdout) || encoding;
        }
        encoding = iconv.encodingExists(encoding) ? encoding : 'utf8';
        return iconv.decode(stdout, encoding);
    }
    async buffer(object) {
        const child = this.stream(['show', '--textconv', object]);
        if (!child.stdout) {
            return Promise.reject('Can\'t open file from git');
        }
        const { exitCode, stdout, stderr } = await exec(child);
        if (exitCode) {
            const err = new GitError({
                message: 'Could not show object.',
                exitCode
            });
            if (/exists on disk, but not in/.test(stderr)) {
                err.gitErrorCode = "WrongCase";
            }
            return Promise.reject(err);
        }
        return stdout;
    }
    async getObjectDetails(treeish, path) {
        if (!treeish) {
            const elements = await this.lsfiles(path);
            if (elements.length === 0) {
                throw new GitError({ message: 'Path not known by git', gitErrorCode: "UnknownPath" });
            }
            const { mode, object } = elements[0];
            const catFile = await this.exec(['cat-file', '-s', object]);
            const size = parseInt(catFile.stdout);
            return { mode, object, size };
        }
        const elements = await this.lstree(treeish, path);
        if (elements.length === 0) {
            throw new GitError({ message: 'Path not known by git', gitErrorCode: "UnknownPath" });
        }
        const { mode, object, size } = elements[0];
        return { mode, object, size: parseInt(size) };
    }
    async lstree(treeish, path) {
        const { stdout } = await this.exec(['ls-tree', '-l', treeish, '--', sanitizePath(path)]);
        return parseLsTree(stdout);
    }
    async lsfiles(path) {
        const { stdout } = await this.exec(['ls-files', '--stage', '--', sanitizePath(path)]);
        return parseLsFiles(stdout);
    }
    async getGitRelativePath(ref, relativePath) {
        const relativePathLowercase = relativePath.toLowerCase();
        const dirname = path.posix.dirname(relativePath) + '/';
        const elements = ref ? await this.lstree(ref, dirname) : await this.lsfiles(dirname);
        const element = elements.filter(file => file.file.toLowerCase() === relativePathLowercase)[0];
        if (!element) {
            throw new GitError({ message: 'Git relative path not found.' });
        }
        return element.file;
    }
    async detectObjectType(object) {
        const child = await this.stream(['show', '--textconv', object]);
        const buffer = await (0, util_1.readBytes)(child.stdout, 4100);
        try {
            child.kill();
        }
        catch (err) {
        }
        const encoding = (0, util_1.detectUnicodeEncoding)(buffer);
        let isText = true;
        if (encoding !== "utf16be" && encoding !== "utf16le") {
            for (let i = 0; i < buffer.length; i++) {
                if (buffer.readInt8(i) === 0) {
                    isText = false;
                    break;
                }
            }
        }
        if (!isText) {
            const result = filetype(buffer);
            if (!result) {
                return { mimetype: 'application/octet-stream' };
            }
            else {
                return { mimetype: result.mime };
            }
        }
        if (encoding) {
            return { mimetype: 'text/plain', encoding };
        }
        else {
            return { mimetype: 'text/plain' };
        }
    }
    async apply(patch, reverse) {
        const args = ['apply', patch];
        if (reverse) {
            args.push('-R');
        }
        try {
            await this.exec(args);
        }
        catch (err) {
            if (/patch does not apply/.test(err.stderr)) {
                err.gitErrorCode = "PatchDoesNotApply";
            }
            throw err;
        }
    }
    async diff(cached = false) {
        const args = ['diff'];
        if (cached) {
            args.push('--cached');
        }
        const result = await this.exec(args);
        return result.stdout;
    }
    async diffWithHEAD(path) {
        if (!path) {
            return await this.diffFiles(false);
        }
        const args = ['diff', '--', sanitizePath(path)];
        const result = await this.exec(args);
        return result.stdout;
    }
    async diffWith(ref, path) {
        if (!path) {
            return await this.diffFiles(false, ref);
        }
        const args = ['diff', ref, '--', sanitizePath(path)];
        const result = await this.exec(args);
        return result.stdout;
    }
    async diffIndexWithHEAD(path) {
        if (!path) {
            return await this.diffFiles(true);
        }
        const args = ['diff', '--cached', '--', sanitizePath(path)];
        const result = await this.exec(args);
        return result.stdout;
    }
    async diffIndexWith(ref, path) {
        if (!path) {
            return await this.diffFiles(true, ref);
        }
        const args = ['diff', '--cached', ref, '--', sanitizePath(path)];
        const result = await this.exec(args);
        return result.stdout;
    }
    async diffBlobs(object1, object2) {
        const args = ['diff', object1, object2];
        const result = await this.exec(args);
        return result.stdout;
    }
    async diffBetween(ref1, ref2, path) {
        const range = `${ref1}...${ref2}`;
        if (!path) {
            return await this.diffFiles(false, range);
        }
        const args = ['diff', range, '--', sanitizePath(path)];
        const result = await this.exec(args);
        return result.stdout.trim();
    }
    async diffFiles(cached, ref) {
        const args = ['diff', '--name-status', '-z', '--diff-filter=ADMR'];
        if (cached) {
            args.push('--cached');
        }
        if (ref) {
            args.push(ref);
        }
        const gitResult = await this.exec(args);
        if (gitResult.exitCode) {
            return [];
        }
        const entries = gitResult.stdout.split('\x00');
        let index = 0;
        const result = [];
        entriesLoop: while (index < entries.length - 1) {
            const change = entries[index++];
            const resourcePath = entries[index++];
            if (!change || !resourcePath) {
                break;
            }
            const originalUri = vscode_1.Uri.file(path.isAbsolute(resourcePath) ? resourcePath : path.join(this.repositoryRoot, resourcePath));
            let status = 7;
            switch (change[0]) {
                case 'M':
                    status = 5;
                    break;
                case 'A':
                    status = 1;
                    break;
                case 'D':
                    status = 6;
                    break;
                case 'R':
                    if (index >= entries.length) {
                        break;
                    }
                    const newPath = entries[index++];
                    if (!newPath) {
                        break;
                    }
                    const uri = vscode_1.Uri.file(path.isAbsolute(newPath) ? newPath : path.join(this.repositoryRoot, newPath));
                    result.push({
                        uri,
                        renameUri: uri,
                        originalUri,
                        status: 3
                    });
                    continue;
                default:
                    break entriesLoop;
            }
            result.push({
                status,
                originalUri,
                uri: originalUri,
                renameUri: originalUri,
            });
        }
        return result;
    }
    async getMergeBase(ref1, ref2) {
        const args = ['merge-base', ref1, ref2];
        const result = await this.exec(args);
        return result.stdout.trim();
    }
    async hashObject(data) {
        const args = ['hash-object', '-w', '--stdin'];
        const result = await this.exec(args, { input: data });
        return result.stdout.trim();
    }
    async add(paths, opts) {
        const args = ['add'];
        if (opts && opts.update) {
            args.push('-u');
        }
        else {
            args.push('-A');
        }
        if (paths && paths.length) {
            for (const chunk of (0, util_1.splitInChunks)(paths.map(sanitizePath), MAX_CLI_LENGTH)) {
                await this.exec([...args, '--', ...chunk]);
            }
        }
        else {
            await this.exec([...args, '--', '.']);
        }
    }
    async rm(paths) {
        const args = ['rm', '--'];
        if (!paths || !paths.length) {
            return;
        }
        args.push(...paths.map(sanitizePath));
        await this.exec(args);
    }
    async stage(path, data) {
        const child = this.stream(['hash-object', '--stdin', '-w', '--path', sanitizePath(path)], { stdio: [null, null, null] });
        child.stdin.end(data, 'utf8');
        const { exitCode, stdout } = await exec(child);
        const hash = stdout.toString('utf8');
        if (exitCode) {
            throw new GitError({
                message: 'Could not hash object.',
                exitCode: exitCode
            });
        }
        const treeish = await this.getCommit('HEAD').then(() => 'HEAD', () => '');
        let mode;
        let add = '';
        try {
            const details = await this.getObjectDetails(treeish, path);
            mode = details.mode;
        }
        catch (err) {
            if (err.gitErrorCode !== "UnknownPath") {
                throw err;
            }
            mode = '100644';
            add = '--add';
        }
        await this.exec(['update-index', add, '--cacheinfo', mode, hash, path]);
    }
    async checkout(treeish, paths, opts = Object.create(null)) {
        const args = ['checkout', '-q'];
        if (opts.track) {
            args.push('--track');
        }
        if (opts.detached) {
            args.push('--detach');
        }
        if (treeish) {
            args.push(treeish);
        }
        try {
            if (paths && paths.length > 0) {
                for (const chunk of (0, util_1.splitInChunks)(paths.map(sanitizePath), MAX_CLI_LENGTH)) {
                    await this.exec([...args, '--', ...chunk]);
                }
            }
            else {
                await this.exec(args);
            }
        }
        catch (err) {
            if (/Please,? commit your changes or stash them/.test(err.stderr || '')) {
                err.gitErrorCode = "DirtyWorkTree";
                err.gitTreeish = treeish;
            }
            throw err;
        }
    }
    async commit(message, opts = Object.create(null)) {
        var _a;
        const args = ['commit', '--quiet', '--allow-empty-message'];
        if (opts.all) {
            args.push('--all');
        }
        if (opts.amend && message) {
            args.push('--amend');
        }
        if (opts.amend && !message) {
            args.push('--amend', '--no-edit');
        }
        else {
            args.push('--file', '-');
        }
        if (opts.signoff) {
            args.push('--signoff');
        }
        if (opts.signCommit) {
            args.push('-S');
        }
        if (opts.empty) {
            args.push('--allow-empty');
        }
        if (opts.noVerify) {
            args.push('--no-verify');
        }
        if ((_a = opts.requireUserConfig) !== null && _a !== void 0 ? _a : true) {
            args.splice(0, 0, '-c', 'user.useConfigOnly=true');
        }
        try {
            await this.exec(args, !opts.amend || message ? { input: message || '' } : {});
        }
        catch (commitErr) {
            await this.handleCommitError(commitErr);
        }
    }
    async rebaseAbort() {
        await this.exec(['rebase', '--abort']);
    }
    async rebaseContinue() {
        const args = ['rebase', '--continue'];
        try {
            await this.exec(args);
        }
        catch (commitErr) {
            await this.handleCommitError(commitErr);
        }
    }
    async handleCommitError(commitErr) {
        if (/not possible because you have unmerged files/.test(commitErr.stderr || '')) {
            commitErr.gitErrorCode = "UnmergedChanges";
            throw commitErr;
        }
        try {
            await this.exec(['config', '--get-all', 'user.name']);
        }
        catch (err) {
            err.gitErrorCode = "NoUserNameConfigured";
            throw err;
        }
        try {
            await this.exec(['config', '--get-all', 'user.email']);
        }
        catch (err) {
            err.gitErrorCode = "NoUserEmailConfigured";
            throw err;
        }
        throw commitErr;
    }
    async branch(name, checkout, ref) {
        const args = checkout ? ['checkout', '-q', '-b', name, '--no-track'] : ['branch', '-q', name];
        if (ref) {
            args.push(ref);
        }
        await this.exec(args);
    }
    async deleteBranch(name, force) {
        const args = ['branch', force ? '-D' : '-d', name];
        await this.exec(args);
    }
    async renameBranch(name) {
        const args = ['branch', '-m', name];
        await this.exec(args);
    }
    async move(from, to) {
        const args = ['mv', from, to];
        await this.exec(args);
    }
    async setBranchUpstream(name, upstream) {
        const args = ['branch', '--set-upstream-to', upstream, name];
        await this.exec(args);
    }
    async deleteRef(ref) {
        const args = ['update-ref', '-d', ref];
        await this.exec(args);
    }
    async merge(ref) {
        const args = ['merge', ref];
        try {
            await this.exec(args);
        }
        catch (err) {
            if (/^CONFLICT /m.test(err.stdout || '')) {
                err.gitErrorCode = "Conflict";
            }
            throw err;
        }
    }
    async tag(name, message) {
        let args = ['tag'];
        if (message) {
            args = [...args, '-a', name, '-m', message];
        }
        else {
            args = [...args, name];
        }
        await this.exec(args);
    }
    async deleteTag(name) {
        let args = ['tag', '-d', name];
        await this.exec(args);
    }
    async clean(paths) {
        const pathsByGroup = (0, util_1.groupBy)(paths.map(sanitizePath), p => path.dirname(p));
        const groups = Object.keys(pathsByGroup).map(k => pathsByGroup[k]);
        const limiter = new util_1.Limiter(5);
        const promises = [];
        const args = ['clean', '-f', '-q'];
        for (const paths of groups) {
            for (const chunk of (0, util_1.splitInChunks)(paths.map(sanitizePath), MAX_CLI_LENGTH)) {
                promises.push(limiter.queue(() => this.exec([...args, '--', ...chunk])));
            }
        }
        await Promise.all(promises);
    }
    async undo() {
        await this.exec(['clean', '-fd']);
        try {
            await this.exec(['checkout', '--', '.']);
        }
        catch (err) {
            if (/did not match any file\(s\) known to git\./.test(err.stderr || '')) {
                return;
            }
            throw err;
        }
    }
    async reset(treeish, hard = false) {
        const args = ['reset', hard ? '--hard' : '--soft', treeish];
        await this.exec(args);
    }
    async revert(treeish, paths) {
        const result = await this.exec(['branch']);
        let args;
        if (!result.stdout) {
            args = ['rm', '--cached', '-r'];
        }
        else {
            args = ['reset', '-q', treeish];
        }
        try {
            if (paths && paths.length > 0) {
                for (const chunk of (0, util_1.splitInChunks)(paths.map(sanitizePath), MAX_CLI_LENGTH)) {
                    await this.exec([...args, '--', ...chunk]);
                }
            }
            else {
                await this.exec([...args, '--', '.']);
            }
        }
        catch (err) {
            if (/([^:]+: needs merge\n)+/m.test(err.stdout || '')) {
                return;
            }
            throw err;
        }
    }
    async addRemote(name, url) {
        const args = ['remote', 'add', name, url];
        await this.exec(args);
    }
    async removeRemote(name) {
        const args = ['remote', 'remove', name];
        await this.exec(args);
    }
    async renameRemote(name, newName) {
        const args = ['remote', 'rename', name, newName];
        await this.exec(args);
    }
    async fetch(options = {}) {
        const args = ['fetch'];
        const spawnOptions = {
            cancellationToken: options.cancellationToken,
            env: { 'GIT_HTTP_USER_AGENT': this.git.userAgent }
        };
        if (options.remote) {
            args.push(options.remote);
            if (options.ref) {
                args.push(options.ref);
            }
        }
        else if (options.all) {
            args.push('--all');
        }
        if (options.prune) {
            args.push('--prune');
        }
        if (typeof options.depth === 'number') {
            args.push(`--depth=${options.depth}`);
        }
        if (options.silent) {
            spawnOptions.env['VSCODE_GIT_FETCH_SILENT'] = 'true';
        }
        try {
            await this.exec(args, spawnOptions);
        }
        catch (err) {
            if (/No remote repository specified\./.test(err.stderr || '')) {
                err.gitErrorCode = "NoRemoteRepositorySpecified";
            }
            else if (/Could not read from remote repository/.test(err.stderr || '')) {
                err.gitErrorCode = "RemoteConnectionError";
            }
            throw err;
        }
    }
    async pull(rebase, remote, branch, options = {}) {
        const args = ['pull'];
        if (options.tags) {
            args.push('--tags');
        }
        if (options.unshallow) {
            args.push('--unshallow');
        }
        if (rebase) {
            args.push('-r');
        }
        if (remote && branch) {
            args.push(remote);
            args.push(branch);
        }
        try {
            await this.exec(args, {
                cancellationToken: options.cancellationToken,
                env: { 'GIT_HTTP_USER_AGENT': this.git.userAgent }
            });
        }
        catch (err) {
            if (/^CONFLICT \([^)]+\): \b/m.test(err.stdout || '')) {
                err.gitErrorCode = "Conflict";
            }
            else if (/Please tell me who you are\./.test(err.stderr || '')) {
                err.gitErrorCode = "NoUserNameConfigured";
            }
            else if (/Could not read from remote repository/.test(err.stderr || '')) {
                err.gitErrorCode = "RemoteConnectionError";
            }
            else if (/Pull(?:ing)? is not possible because you have unmerged files|Cannot pull with rebase: You have unstaged changes|Your local changes to the following files would be overwritten|Please, commit your changes before you can merge/i.test(err.stderr)) {
                err.stderr = err.stderr.replace(/Cannot pull with rebase: You have unstaged changes/i, 'Cannot pull with rebase, you have unstaged changes');
                err.gitErrorCode = "DirtyWorkTree";
            }
            else if (/cannot lock ref|unable to update local ref/i.test(err.stderr || '')) {
                err.gitErrorCode = "CantLockRef";
            }
            else if (/cannot rebase onto multiple branches/i.test(err.stderr || '')) {
                err.gitErrorCode = "CantRebaseMultipleBranches";
            }
            throw err;
        }
    }
    async rebase(branch, options = {}) {
        const args = ['rebase'];
        args.push(branch);
        try {
            await this.exec(args, options);
        }
        catch (err) {
            if (/^CONFLICT \([^)]+\): \b/m.test(err.stdout || '')) {
                err.gitErrorCode = "Conflict";
            }
            else if (/cannot rebase onto multiple branches/i.test(err.stderr || '')) {
                err.gitErrorCode = "CantRebaseMultipleBranches";
            }
            throw err;
        }
    }
    async push(remote, name, setUpstream = false, followTags = false, forcePushMode, tags = false) {
        const args = ['push'];
        if (forcePushMode === 1) {
            args.push('--force-with-lease');
        }
        else if (forcePushMode === 0) {
            args.push('--force');
        }
        if (setUpstream) {
            args.push('-u');
        }
        if (followTags) {
            args.push('--follow-tags');
        }
        if (tags) {
            args.push('--tags');
        }
        if (remote) {
            args.push(remote);
        }
        if (name) {
            args.push(name);
        }
        try {
            await this.exec(args, { env: { 'GIT_HTTP_USER_AGENT': this.git.userAgent } });
        }
        catch (err) {
            if (/^error: failed to push some refs to\b/m.test(err.stderr || '')) {
                err.gitErrorCode = "PushRejected";
            }
            else if (/Could not read from remote repository/.test(err.stderr || '')) {
                err.gitErrorCode = "RemoteConnectionError";
            }
            else if (/^fatal: The current branch .* has no upstream branch/.test(err.stderr || '')) {
                err.gitErrorCode = "NoUpstreamBranch";
            }
            else if (/Permission.*denied/.test(err.stderr || '')) {
                err.gitErrorCode = "PermissionDenied";
            }
            throw err;
        }
    }
    async cherryPick(commitHash) {
        const args = ['cherry-pick', commitHash];
        await this.exec(args);
    }
    async blame(path) {
        try {
            const args = ['blame', sanitizePath(path)];
            const result = await this.exec(args);
            return result.stdout.trim();
        }
        catch (err) {
            if (/^fatal: no such path/.test(err.stderr || '')) {
                err.gitErrorCode = "NoPathFound";
            }
            throw err;
        }
    }
    async createStash(message, includeUntracked) {
        try {
            const args = ['stash', 'push'];
            if (includeUntracked) {
                args.push('-u');
            }
            if (message) {
                args.push('-m', message);
            }
            await this.exec(args);
        }
        catch (err) {
            if (/No local changes to save/.test(err.stderr || '')) {
                err.gitErrorCode = "NoLocalChanges";
            }
            throw err;
        }
    }
    async popStash(index) {
        const args = ['stash', 'pop'];
        await this.popOrApplyStash(args, index);
    }
    async applyStash(index) {
        const args = ['stash', 'apply'];
        await this.popOrApplyStash(args, index);
    }
    async popOrApplyStash(args, index) {
        try {
            if (typeof index === 'number') {
                args.push(`stash@{${index}}`);
            }
            await this.exec(args);
        }
        catch (err) {
            if (/No stash found/.test(err.stderr || '')) {
                err.gitErrorCode = "NoStashFound";
            }
            else if (/error: Your local changes to the following files would be overwritten/.test(err.stderr || '')) {
                err.gitErrorCode = "LocalChangesOverwritten";
            }
            else if (/^CONFLICT/m.test(err.stdout || '')) {
                err.gitErrorCode = "StashConflict";
            }
            throw err;
        }
    }
    async dropStash(index) {
        const args = ['stash', 'drop'];
        if (typeof index === 'number') {
            args.push(`stash@{${index}}`);
        }
        try {
            await this.exec(args);
        }
        catch (err) {
            if (/No stash found/.test(err.stderr || '')) {
                err.gitErrorCode = "NoStashFound";
            }
            throw err;
        }
    }
    getStatus(opts) {
        return new Promise((c, e) => {
            var _a;
            const parser = new GitStatusParser();
            const env = { GIT_OPTIONAL_LOCKS: '0' };
            const args = ['status', '-z', '-u'];
            if (opts === null || opts === void 0 ? void 0 : opts.ignoreSubmodules) {
                args.push('--ignore-submodules');
            }
            const child = this.stream(args, { env });
            const onExit = (exitCode) => {
                if (exitCode !== 0) {
                    const stderr = stderrData.join('');
                    return e(new GitError({
                        message: 'Failed to execute git',
                        stderr,
                        exitCode,
                        gitErrorCode: getGitErrorCode(stderr),
                        gitCommand: 'status',
                        gitArgs: args
                    }));
                }
                c({ status: parser.status, didHitLimit: false });
            };
            const limit = (_a = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _a !== void 0 ? _a : 5000;
            const onStdoutData = (raw) => {
                parser.update(raw);
                if (parser.status.length > limit) {
                    child.removeListener('exit', onExit);
                    child.stdout.removeListener('data', onStdoutData);
                    child.kill();
                    c({ status: parser.status.slice(0, limit), didHitLimit: true });
                }
            };
            child.stdout.setEncoding('utf8');
            child.stdout.on('data', onStdoutData);
            const stderrData = [];
            child.stderr.setEncoding('utf8');
            child.stderr.on('data', raw => stderrData.push(raw));
            child.on('error', cpErrorHandler(e));
            child.on('exit', onExit);
        });
    }
    async getHEAD() {
        try {
            const result = await this.exec(['symbolic-ref', '--short', 'HEAD']);
            if (!result.stdout) {
                throw new Error('Not in a branch');
            }
            return { name: result.stdout.trim(), commit: undefined, type: 0 };
        }
        catch (err) {
            const result = await this.exec(['rev-parse', 'HEAD']);
            if (!result.stdout) {
                throw new Error('Error parsing HEAD');
            }
            return { name: undefined, commit: result.stdout.trim(), type: 0 };
        }
    }
    async findTrackingBranches(upstreamBranch) {
        const result = await this.exec(['for-each-ref', '--format', '%(refname:short)%00%(upstream:short)', 'refs/heads']);
        return result.stdout.trim().split('\n')
            .map(line => line.trim().split('\0'))
            .filter(([_, upstream]) => upstream === upstreamBranch)
            .map(([ref]) => ({ name: ref, type: 0 }));
    }
    async getRefs(opts) {
        const args = ['for-each-ref'];
        if (opts === null || opts === void 0 ? void 0 : opts.count) {
            args.push(`--count=${opts.count}`);
        }
        if (opts && opts.sort && opts.sort !== 'alphabetically') {
            args.push('--sort', `-${opts.sort}`);
        }
        args.push('--format', '%(refname) %(objectname) %(*objectname)');
        if (opts === null || opts === void 0 ? void 0 : opts.pattern) {
            args.push(opts.pattern);
        }
        if (opts === null || opts === void 0 ? void 0 : opts.contains) {
            args.push('--contains', opts.contains);
        }
        const result = await this.exec(args);
        const fn = (line) => {
            var _a;
            let match;
            if (match = /^refs\/heads\/([^ ]+) ([0-9a-f]{40}) ([0-9a-f]{40})?$/.exec(line)) {
                return { name: match[1], commit: match[2], type: 0 };
            }
            else if (match = /^refs\/remotes\/([^/]+)\/([^ ]+) ([0-9a-f]{40}) ([0-9a-f]{40})?$/.exec(line)) {
                return { name: `${match[1]}/${match[2]}`, commit: match[3], type: 1, remote: match[1] };
            }
            else if (match = /^refs\/tags\/([^ ]+) ([0-9a-f]{40}) ([0-9a-f]{40})?$/.exec(line)) {
                return { name: match[1], commit: (_a = match[3]) !== null && _a !== void 0 ? _a : match[2], type: 2 };
            }
            return null;
        };
        return result.stdout.split('\n')
            .filter(line => !!line)
            .map(fn)
            .filter(ref => !!ref);
    }
    async getStashes() {
        const result = await this.exec(['stash', 'list']);
        const regex = /^stash@{(\d+)}:(.+)$/;
        const rawStashes = result.stdout.trim().split('\n')
            .filter(b => !!b)
            .map(line => regex.exec(line))
            .filter(g => !!g)
            .map(([, index, description]) => ({ index: parseInt(index), description }));
        return rawStashes;
    }
    async getRemotes() {
        const result = await this.exec(['remote', '--verbose']);
        const lines = result.stdout.trim().split('\n').filter(l => !!l);
        const remotes = [];
        for (const line of lines) {
            const parts = line.split(/\s/);
            const [name, url, type] = parts;
            let remote = remotes.find(r => r.name === name);
            if (!remote) {
                remote = { name, isReadOnly: false };
                remotes.push(remote);
            }
            if (/fetch/i.test(type)) {
                remote.fetchUrl = url;
            }
            else if (/push/i.test(type)) {
                remote.pushUrl = url;
            }
            else {
                remote.fetchUrl = url;
                remote.pushUrl = url;
            }
            remote.isReadOnly = remote.pushUrl === undefined || remote.pushUrl === 'no_push';
        }
        return remotes;
    }
    async getBranch(name) {
        if (name === 'HEAD') {
            return this.getHEAD();
        }
        const args = ['for-each-ref'];
        let supportsAheadBehind = true;
        if (this._git.compareGitVersionTo('1.9.0') === -1) {
            args.push('--format=%(refname)%00%(upstream:short)%00%(objectname)');
            supportsAheadBehind = false;
        }
        else {
            args.push('--format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)');
        }
        if (/^refs\/(head|remotes)\//i.test(name)) {
            args.push(name);
        }
        else {
            args.push(`refs/heads/${name}`, `refs/remotes/${name}`);
        }
        const result = await this.exec(args);
        const branches = result.stdout.trim().split('\n').map(line => {
            let [branchName, upstream, ref, status] = line.trim().split('\0');
            if (branchName.startsWith('refs/heads/')) {
                branchName = branchName.substring(11);
                const index = upstream.indexOf('/');
                let ahead;
                let behind;
                const match = /\[(?:ahead ([0-9]+))?[,\s]*(?:behind ([0-9]+))?]|\[gone]/.exec(status);
                if (match) {
                    [, ahead, behind] = match;
                }
                return {
                    type: 0,
                    name: branchName,
                    upstream: upstream ? {
                        name: upstream.substring(index + 1),
                        remote: upstream.substring(0, index)
                    } : undefined,
                    commit: ref || undefined,
                    ahead: Number(ahead) || 0,
                    behind: Number(behind) || 0,
                };
            }
            else if (branchName.startsWith('refs/remotes/')) {
                branchName = branchName.substring(13);
                const index = branchName.indexOf('/');
                return {
                    type: 1,
                    name: branchName.substring(index + 1),
                    remote: branchName.substring(0, index),
                    commit: ref,
                };
            }
            else {
                return undefined;
            }
        }).filter((b) => !!b);
        if (branches.length) {
            const [branch] = branches;
            if (!supportsAheadBehind && branch.upstream) {
                try {
                    const result = await this.exec(['rev-list', '--left-right', '--count', `${branch.name}...${branch.upstream.remote}/${branch.upstream.name}`]);
                    const [ahead, behind] = result.stdout.trim().split('\t');
                    branch.ahead = Number(ahead) || 0;
                    branch.behind = Number(behind) || 0;
                }
                catch (_a) { }
            }
            return branch;
        }
        return Promise.reject(new Error('No such branch'));
    }
    async getBranches(query) {
        const refs = await this.getRefs({ contains: query.contains, pattern: query.pattern ? `refs/${query.pattern}` : undefined, count: query.count });
        return refs.filter(value => (value.type !== 2) && (query.remote || !value.remote));
    }
    stripCommitMessageComments(message) {
        return message.replace(/^\s*#.*$\n?/gm, '').trim();
    }
    async getSquashMessage() {
        const squashMsgPath = path.join(this.repositoryRoot, '.git', 'SQUASH_MSG');
        try {
            const raw = await fs_1.promises.readFile(squashMsgPath, 'utf8');
            return this.stripCommitMessageComments(raw);
        }
        catch (_a) {
            return undefined;
        }
    }
    async getMergeMessage() {
        const mergeMsgPath = path.join(this.repositoryRoot, '.git', 'MERGE_MSG');
        try {
            const raw = await fs_1.promises.readFile(mergeMsgPath, 'utf8');
            return this.stripCommitMessageComments(raw);
        }
        catch (_a) {
            return undefined;
        }
    }
    async getCommitTemplate() {
        try {
            const result = await this.exec(['config', '--get', 'commit.template']);
            if (!result.stdout) {
                return '';
            }
            const homedir = os.homedir();
            let templatePath = result.stdout.trim()
                .replace(/^~([^\/]*)\//, (_, user) => `${user ? path.join(path.dirname(homedir), user) : homedir}/`);
            if (!path.isAbsolute(templatePath)) {
                templatePath = path.join(this.repositoryRoot, templatePath);
            }
            const raw = await fs_1.promises.readFile(templatePath, 'utf8');
            return this.stripCommitMessageComments(raw);
        }
        catch (err) {
            return '';
        }
    }
    async getCommit(ref) {
        const result = await this.exec(['show', '-s', `--format=${COMMIT_FORMAT}`, '-z', ref]);
        const commits = parseGitCommits(result.stdout);
        if (commits.length === 0) {
            return Promise.reject('bad commit format');
        }
        return commits[0];
    }
    async updateSubmodules(paths) {
        const args = ['submodule', 'update'];
        for (const chunk of (0, util_1.splitInChunks)(paths.map(sanitizePath), MAX_CLI_LENGTH)) {
            await this.exec([...args, '--', ...chunk]);
        }
    }
    async getSubmodules() {
        const gitmodulesPath = path.join(this.root, '.gitmodules');
        try {
            const gitmodulesRaw = await fs_1.promises.readFile(gitmodulesPath, 'utf8');
            return parseGitmodules(gitmodulesRaw);
        }
        catch (err) {
            if (/ENOENT/.test(err.message)) {
                return [];
            }
            throw err;
        }
    }
}
exports.Repository = Repository;
//# sourceMappingURL=git.js.map