"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toGitUri = exports.fromGitUri = exports.isGitUri = void 0;
function isGitUri(uri) {
    return /^git$/.test(uri.scheme);
}
exports.isGitUri = isGitUri;
function fromGitUri(uri) {
    return JSON.parse(uri.query);
}
exports.fromGitUri = fromGitUri;
function toGitUri(uri, ref, options = {}) {
    const params = {
        path: uri.fsPath,
        ref
    };
    if (options.submoduleOf) {
        params.submoduleOf = options.submoduleOf;
    }
    let path = uri.path;
    if (options.replaceFileExtension) {
        path = `${path}.git`;
    }
    else if (options.submoduleOf) {
        path = `${path}.diff`;
    }
    return uri.with({
        scheme: 'git',
        path,
        query: JSON.stringify(params)
    });
}
exports.toGitUri = toGitUri;
//# sourceMappingURL=uri.js.map