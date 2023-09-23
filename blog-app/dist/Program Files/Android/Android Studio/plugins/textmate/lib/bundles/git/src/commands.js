"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandCenter = void 0;
const os = require("os");
const path = require("path");
const vscode_1 = require("vscode");
const nls = require("vscode-nls");
const repository_1 = require("./repository");
const staging_1 = require("./staging");
const uri_1 = require("./uri");
const util_1 = require("./util");
const log_1 = require("./log");
const timelineProvider_1 = require("./timelineProvider");
const api1_1 = require("./api/api1");
const remoteSource_1 = require("./remoteSource");
const localize = nls.loadMessageBundle();
class CheckoutItem {
    constructor(ref) {
        this.ref = ref;
    }
    get shortCommit() { return (this.ref.commit || '').substr(0, 8); }
    get label() { return this.ref.name || this.shortCommit; }
    get description() { return this.shortCommit; }
    async run(repository, opts) {
        const ref = this.ref.name;
        if (!ref) {
            return;
        }
        await repository.checkout(ref, opts);
    }
}
class CheckoutTagItem extends CheckoutItem {
    get description() {
        return localize('tag at', "Tag at {0}", this.shortCommit);
    }
}
class CheckoutRemoteHeadItem extends CheckoutItem {
    get description() {
        return localize('remote branch at', "Remote branch at {0}", this.shortCommit);
    }
    async run(repository, opts) {
        if (!this.ref.name) {
            return;
        }
        const branches = await repository.findTrackingBranches(this.ref.name);
        if (branches.length > 0) {
            await repository.checkout(branches[0].name, opts);
        }
        else {
            await repository.checkoutTracking(this.ref.name, opts);
        }
    }
}
class BranchDeleteItem {
    constructor(ref) {
        this.ref = ref;
    }
    get shortCommit() { return (this.ref.commit || '').substr(0, 8); }
    get branchName() { return this.ref.name; }
    get label() { return this.branchName || ''; }
    get description() { return this.shortCommit; }
    async run(repository, force) {
        if (!this.branchName) {
            return;
        }
        await repository.deleteBranch(this.branchName, force);
    }
}
class MergeItem {
    constructor(ref) {
        this.ref = ref;
    }
    get label() { return this.ref.name || ''; }
    get description() { return this.ref.name || ''; }
    async run(repository) {
        await repository.merge(this.ref.name || this.ref.commit);
    }
}
class RebaseItem {
    constructor(ref) {
        this.ref = ref;
        this.description = '';
    }
    get label() { return this.ref.name || ''; }
    async run(repository) {
        var _a;
        if ((_a = this.ref) === null || _a === void 0 ? void 0 : _a.name) {
            await repository.rebase(this.ref.name);
        }
    }
}
class CreateBranchItem {
    get label() { return '$(plus) ' + localize('create branch', 'Create new branch...'); }
    get description() { return ''; }
    get alwaysShow() { return true; }
}
class CreateBranchFromItem {
    get label() { return '$(plus) ' + localize('create branch from', 'Create new branch from...'); }
    get description() { return ''; }
    get alwaysShow() { return true; }
}
class CheckoutDetachedItem {
    get label() { return '$(debug-disconnect) ' + localize('checkout detached', 'Checkout detached...'); }
    get description() { return ''; }
    get alwaysShow() { return true; }
}
class HEADItem {
    constructor(repository) {
        this.repository = repository;
    }
    get label() { return 'HEAD'; }
    get description() { return (this.repository.HEAD && this.repository.HEAD.commit || '').substr(0, 8); }
    get alwaysShow() { return true; }
}
class AddRemoteItem {
    constructor(cc) {
        this.cc = cc;
    }
    get label() { return '$(plus) ' + localize('add remote', 'Add a new remote...'); }
    get description() { return ''; }
    get alwaysShow() { return true; }
    async run(repository) {
        await this.cc.addRemote(repository);
    }
}
const Commands = [];
function command(commandId, options = {}) {
    return (_target, key, descriptor) => {
        if (!(typeof descriptor.value === 'function')) {
            throw new Error('not supported');
        }
        Commands.push({ commandId, key, method: descriptor.value, options });
    };
}
async function categorizeResourceByResolution(resources) {
    const selection = resources.filter(s => s instanceof repository_1.Resource);
    const merge = selection.filter(s => s.resourceGroupType === 0);
    const isBothAddedOrModified = (s) => s.type === 16 || s.type === 14;
    const isAnyDeleted = (s) => s.type === 13 || s.type === 12;
    const possibleUnresolved = merge.filter(isBothAddedOrModified);
    const promises = possibleUnresolved.map(s => (0, util_1.grep)(s.resourceUri.fsPath, /^<{7}|^={7}|^>{7}/));
    const unresolvedBothModified = await Promise.all(promises);
    const resolved = possibleUnresolved.filter((_s, i) => !unresolvedBothModified[i]);
    const deletionConflicts = merge.filter(s => isAnyDeleted(s));
    const unresolved = [
        ...merge.filter(s => !isBothAddedOrModified(s) && !isAnyDeleted(s)),
        ...possibleUnresolved.filter((_s, i) => unresolvedBothModified[i])
    ];
    return { merge, resolved, unresolved, deletionConflicts };
}
function createCheckoutItems(repository) {
    const config = vscode_1.workspace.getConfiguration('git');
    const checkoutTypeConfig = config.get('checkoutType');
    let checkoutTypes;
    if (checkoutTypeConfig === 'all' || !checkoutTypeConfig || checkoutTypeConfig.length === 0) {
        checkoutTypes = ['local', 'remote', 'tags'];
    }
    else if (typeof checkoutTypeConfig === 'string') {
        checkoutTypes = [checkoutTypeConfig];
    }
    else {
        checkoutTypes = checkoutTypeConfig;
    }
    const processors = checkoutTypes.map(getCheckoutProcessor)
        .filter(p => !!p);
    for (const ref of repository.refs) {
        for (const processor of processors) {
            processor.onRef(ref);
        }
    }
    return processors.reduce((r, p) => r.concat(...p.items), []);
}
class CheckoutProcessor {
    constructor(type, ctor) {
        this.type = type;
        this.ctor = ctor;
        this.refs = [];
    }
    get items() { return this.refs.map(r => new this.ctor(r)); }
    onRef(ref) {
        if (ref.type === this.type) {
            this.refs.push(ref);
        }
    }
}
function getCheckoutProcessor(type) {
    switch (type) {
        case 'local':
            return new CheckoutProcessor(0, CheckoutItem);
        case 'remote':
            return new CheckoutProcessor(1, CheckoutRemoteHeadItem);
        case 'tags':
            return new CheckoutProcessor(2, CheckoutTagItem);
    }
    return undefined;
}
function sanitizeRemoteName(name) {
    name = name.trim();
    return name && name.replace(/^\.|\/\.|\.\.|~|\^|:|\/$|\.lock$|\.lock\/|\\|\*|\s|^\s*$|\.$|\[|\]$/g, '-');
}
class TagItem {
    constructor(ref) {
        this.ref = ref;
    }
    get label() { var _a; return (_a = this.ref.name) !== null && _a !== void 0 ? _a : ''; }
    get description() { var _a, _b; return (_b = (_a = this.ref.commit) === null || _a === void 0 ? void 0 : _a.substr(0, 8)) !== null && _b !== void 0 ? _b : ''; }
}
var PushType;
(function (PushType) {
    PushType[PushType["Push"] = 0] = "Push";
    PushType[PushType["PushTo"] = 1] = "PushTo";
    PushType[PushType["PushFollowTags"] = 2] = "PushFollowTags";
    PushType[PushType["PushTags"] = 3] = "PushTags";
})(PushType || (PushType = {}));
class CommandErrorOutputTextDocumentContentProvider {
    constructor() {
        this.items = new Map();
    }
    set(uri, contents) {
        this.items.set(uri.path, contents);
    }
    delete(uri) {
        this.items.delete(uri.path);
    }
    provideTextDocumentContent(uri) {
        return this.items.get(uri.path);
    }
}
class CommandCenter {
    constructor(git, model, outputChannel, telemetryReporter) {
        this.git = git;
        this.model = model;
        this.outputChannel = outputChannel;
        this.telemetryReporter = telemetryReporter;
        this.commandErrors = new CommandErrorOutputTextDocumentContentProvider();
        this.disposables = Commands.map(({ commandId, key, method, options }) => {
            const command = this.createCommand(commandId, key, method, options);
            if (options.diff) {
                return vscode_1.commands.registerDiffInformationCommand(commandId, command);
            }
            else {
                return vscode_1.commands.registerCommand(commandId, command);
            }
        });
        this.disposables.push(vscode_1.workspace.registerTextDocumentContentProvider('git-output', this.commandErrors));
    }
    async setLogLevel() {
        const createItem = (logLevel) => ({
            label: log_1.LogLevel[logLevel],
            logLevel,
            description: log_1.Log.logLevel === logLevel ? localize('current', "Current") : undefined
        });
        const items = [
            createItem(log_1.LogLevel.Trace),
            createItem(log_1.LogLevel.Debug),
            createItem(log_1.LogLevel.Info),
            createItem(log_1.LogLevel.Warning),
            createItem(log_1.LogLevel.Error),
            createItem(log_1.LogLevel.Critical),
            createItem(log_1.LogLevel.Off)
        ];
        const choice = await vscode_1.window.showQuickPick(items, {
            placeHolder: localize('select log level', "Select log level")
        });
        if (!choice) {
            return;
        }
        log_1.Log.logLevel = choice.logLevel;
        this.outputChannel.appendLine(localize('changed', "Log level changed to: {0}", log_1.LogLevel[log_1.Log.logLevel]));
    }
    async refresh(repository) {
        await repository.status();
    }
    async openResource(resource) {
        const repository = this.model.getRepository(resource.resourceUri);
        if (!repository) {
            return;
        }
        await resource.open();
    }
    async openChanges(repository) {
        for (const resource of [...repository.workingTreeGroup.resourceStates, ...repository.untrackedGroup.resourceStates]) {
            if (resource.type === 6 || resource.type === 13 ||
                resource.type === 12 || resource.type === 15) {
                continue;
            }
            void vscode_1.commands.executeCommand('vscode.open', resource.resourceUri, { background: true, preview: false, });
        }
    }
    async cloneRepository(url, parentPath, options = {}) {
        if (!url || typeof url !== 'string') {
            url = await (0, remoteSource_1.pickRemoteSource)(this.model, {
                providerLabel: provider => localize('clonefrom', "Clone from {0}", provider.name),
                urlLabel: localize('repourl', "Clone from URL")
            });
        }
        if (!url) {
            this.telemetryReporter.sendTelemetryEvent('clone', { outcome: 'no_URL' });
            return;
        }
        url = url.trim().replace(/^git\s+clone\s+/, '');
        if (!parentPath) {
            const config = vscode_1.workspace.getConfiguration('git');
            let defaultCloneDirectory = config.get('defaultCloneDirectory') || os.homedir();
            defaultCloneDirectory = defaultCloneDirectory.replace(/^~/, os.homedir());
            const uris = await vscode_1.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                defaultUri: vscode_1.Uri.file(defaultCloneDirectory),
                openLabel: localize('selectFolder', "Select Repository Location")
            });
            if (!uris || uris.length === 0) {
                this.telemetryReporter.sendTelemetryEvent('clone', { outcome: 'no_directory' });
                return;
            }
            const uri = uris[0];
            parentPath = uri.fsPath;
        }
        try {
            const opts = {
                location: vscode_1.ProgressLocation.Notification,
                title: localize('cloning', "Cloning git repository '{0}'...", url),
                cancellable: true
            };
            const repositoryPath = await vscode_1.window.withProgress(opts, (progress, token) => this.git.clone(url, { parentPath: parentPath, progress, recursive: options.recursive }, token));
            const config = vscode_1.workspace.getConfiguration('git');
            const openAfterClone = config.get('openAfterClone');
            let PostCloneAction;
            (function (PostCloneAction) {
                PostCloneAction[PostCloneAction["Open"] = 0] = "Open";
                PostCloneAction[PostCloneAction["OpenNewWindow"] = 1] = "OpenNewWindow";
                PostCloneAction[PostCloneAction["AddToWorkspace"] = 2] = "AddToWorkspace";
            })(PostCloneAction || (PostCloneAction = {}));
            let action = undefined;
            if (openAfterClone === 'always') {
                action = PostCloneAction.Open;
            }
            else if (openAfterClone === 'alwaysNewWindow') {
                action = PostCloneAction.OpenNewWindow;
            }
            else if (openAfterClone === 'whenNoFolderOpen' && !vscode_1.workspace.workspaceFolders) {
                action = PostCloneAction.Open;
            }
            if (action === undefined) {
                let message = localize('proposeopen', "Would you like to open the cloned repository?");
                const open = localize('openrepo', "Open");
                const openNewWindow = localize('openreponew', "Open in New Window");
                const choices = [open, openNewWindow];
                const addToWorkspace = localize('add', "Add to Workspace");
                if (vscode_1.workspace.workspaceFolders) {
                    message = localize('proposeopen2', "Would you like to open the cloned repository, or add it to the current workspace?");
                    choices.push(addToWorkspace);
                }
                const result = await vscode_1.window.showInformationMessage(message, ...choices);
                action = result === open ? PostCloneAction.Open
                    : result === openNewWindow ? PostCloneAction.OpenNewWindow
                        : result === addToWorkspace ? PostCloneAction.AddToWorkspace : undefined;
            }
            this.telemetryReporter.sendTelemetryEvent('clone', { outcome: 'success' }, { openFolder: action === PostCloneAction.Open || action === PostCloneAction.OpenNewWindow ? 1 : 0 });
            const uri = vscode_1.Uri.file(repositoryPath);
            if (action === PostCloneAction.Open) {
                vscode_1.commands.executeCommand('vscode.openFolder', uri, { forceReuseWindow: true });
            }
            else if (action === PostCloneAction.AddToWorkspace) {
                vscode_1.workspace.updateWorkspaceFolders(vscode_1.workspace.workspaceFolders.length, 0, { uri });
            }
            else if (action === PostCloneAction.OpenNewWindow) {
                vscode_1.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: true });
            }
        }
        catch (err) {
            if (/already exists and is not an empty directory/.test(err && err.stderr || '')) {
                this.telemetryReporter.sendTelemetryEvent('clone', { outcome: 'directory_not_empty' });
            }
            else if (/Cancelled/i.test(err && (err.message || err.stderr || ''))) {
                return;
            }
            else {
                this.telemetryReporter.sendTelemetryEvent('clone', { outcome: 'error' });
            }
            throw err;
        }
    }
    async clone(url, parentPath) {
        await this.cloneRepository(url, parentPath);
    }
    async cloneRecursive(url, parentPath) {
        await this.cloneRepository(url, parentPath, { recursive: true });
    }
    async init(skipFolderPrompt = false) {
        let repositoryPath = undefined;
        let askToOpen = true;
        if (vscode_1.workspace.workspaceFolders) {
            if (skipFolderPrompt && vscode_1.workspace.workspaceFolders.length === 1) {
                repositoryPath = vscode_1.workspace.workspaceFolders[0].uri.fsPath;
                askToOpen = false;
            }
            else {
                const placeHolder = localize('init', "Pick workspace folder to initialize git repo in");
                const pick = { label: localize('choose', "Choose Folder...") };
                const items = [
                    ...vscode_1.workspace.workspaceFolders.map(folder => ({ label: folder.name, description: folder.uri.fsPath, folder })),
                    pick
                ];
                const item = await vscode_1.window.showQuickPick(items, { placeHolder, ignoreFocusOut: true });
                if (!item) {
                    return;
                }
                else if (item.folder) {
                    repositoryPath = item.folder.uri.fsPath;
                    askToOpen = false;
                }
            }
        }
        if (!repositoryPath) {
            const homeUri = vscode_1.Uri.file(os.homedir());
            const defaultUri = vscode_1.workspace.workspaceFolders && vscode_1.workspace.workspaceFolders.length > 0
                ? vscode_1.Uri.file(vscode_1.workspace.workspaceFolders[0].uri.fsPath)
                : homeUri;
            const result = await vscode_1.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                defaultUri,
                openLabel: localize('init repo', "Initialize Repository")
            });
            if (!result || result.length === 0) {
                return;
            }
            const uri = result[0];
            if (homeUri.toString().startsWith(uri.toString())) {
                const yes = localize('create repo', "Initialize Repository");
                const answer = await vscode_1.window.showWarningMessage(localize('are you sure', "This will create a Git repository in '{0}'. Are you sure you want to continue?", uri.fsPath), yes);
                if (answer !== yes) {
                    return;
                }
            }
            repositoryPath = uri.fsPath;
            if (vscode_1.workspace.workspaceFolders && vscode_1.workspace.workspaceFolders.some(w => w.uri.toString() === uri.toString())) {
                askToOpen = false;
            }
        }
        await this.git.init(repositoryPath);
        let message = localize('proposeopen init', "Would you like to open the initialized repository?");
        const open = localize('openrepo', "Open");
        const openNewWindow = localize('openreponew', "Open in New Window");
        const choices = [open, openNewWindow];
        if (!askToOpen) {
            return;
        }
        const addToWorkspace = localize('add', "Add to Workspace");
        if (vscode_1.workspace.workspaceFolders) {
            message = localize('proposeopen2 init', "Would you like to open the initialized repository, or add it to the current workspace?");
            choices.push(addToWorkspace);
        }
        const result = await vscode_1.window.showInformationMessage(message, ...choices);
        const uri = vscode_1.Uri.file(repositoryPath);
        if (result === open) {
            vscode_1.commands.executeCommand('vscode.openFolder', uri);
        }
        else if (result === addToWorkspace) {
            vscode_1.workspace.updateWorkspaceFolders(vscode_1.workspace.workspaceFolders.length, 0, { uri });
        }
        else if (result === openNewWindow) {
            vscode_1.commands.executeCommand('vscode.openFolder', uri, true);
        }
        else {
            await this.model.openRepository(repositoryPath);
        }
    }
    async openRepository(path) {
        if (!path) {
            const result = await vscode_1.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                defaultUri: vscode_1.Uri.file(os.homedir()),
                openLabel: localize('open repo', "Open Repository")
            });
            if (!result || result.length === 0) {
                return;
            }
            path = result[0].fsPath;
        }
        await this.model.openRepository(path);
    }
    async close(repository) {
        this.model.close(repository);
    }
    async openFile(arg, ...resourceStates) {
        const preserveFocus = arg instanceof repository_1.Resource;
        let uris;
        if (arg instanceof vscode_1.Uri) {
            if ((0, uri_1.isGitUri)(arg)) {
                uris = [vscode_1.Uri.file((0, uri_1.fromGitUri)(arg).path)];
            }
            else if (arg.scheme === 'file') {
                uris = [arg];
            }
        }
        else {
            let resource = arg;
            if (!(resource instanceof repository_1.Resource)) {
                resource = this.getSCMResource();
            }
            if (resource) {
                uris = [resource, ...resourceStates]
                    .filter(r => r.type !== 6 && r.type !== 2)
                    .map(r => r.resourceUri);
            }
            else if (vscode_1.window.activeTextEditor) {
                uris = [vscode_1.window.activeTextEditor.document.uri];
            }
        }
        if (!uris) {
            return;
        }
        const activeTextEditor = vscode_1.window.activeTextEditor;
        for (const uri of uris) {
            const opts = {
                preserveFocus,
                preview: false,
                viewColumn: vscode_1.ViewColumn.Active
            };
            let document;
            try {
                document = await vscode_1.workspace.openTextDocument(uri);
            }
            catch (error) {
                await vscode_1.commands.executeCommand('vscode.open', uri, Object.assign(Object.assign({}, opts), { override: arg instanceof repository_1.Resource && arg.type === 16 ? false : undefined }));
                continue;
            }
            if (activeTextEditor && activeTextEditor.document.uri.path === uri.path) {
                opts.selection = activeTextEditor.selection;
                const previousVisibleRanges = activeTextEditor.visibleRanges;
                const editor = await vscode_1.window.showTextDocument(document, opts);
                editor.revealRange(previousVisibleRanges[0]);
            }
            else {
                await vscode_1.commands.executeCommand('vscode.open', uri, opts);
            }
        }
    }
    async openFile2(arg, ...resourceStates) {
        this.openFile(arg, ...resourceStates);
    }
    async openHEADFile(arg) {
        let resource = undefined;
        const preview = !(arg instanceof repository_1.Resource);
        if (arg instanceof repository_1.Resource) {
            resource = arg;
        }
        else if (arg instanceof vscode_1.Uri) {
            resource = this.getSCMResource(arg);
        }
        else {
            resource = this.getSCMResource();
        }
        if (!resource) {
            return;
        }
        const HEAD = resource.leftUri;
        const basename = path.basename(resource.resourceUri.fsPath);
        const title = `${basename} (HEAD)`;
        if (!HEAD) {
            vscode_1.window.showWarningMessage(localize('HEAD not available', "HEAD version of '{0}' is not available.", path.basename(resource.resourceUri.fsPath)));
            return;
        }
        const opts = {
            preview
        };
        return await vscode_1.commands.executeCommand('vscode.open', HEAD, opts, title);
    }
    async openChange(arg, ...resourceStates) {
        let resources = undefined;
        if (arg instanceof vscode_1.Uri) {
            const resource = this.getSCMResource(arg);
            if (resource !== undefined) {
                resources = [resource];
            }
        }
        else {
            let resource = undefined;
            if (arg instanceof repository_1.Resource) {
                resource = arg;
            }
            else {
                resource = this.getSCMResource();
            }
            if (resource) {
                resources = [...resourceStates, resource];
            }
        }
        if (!resources) {
            return;
        }
        for (const resource of resources) {
            await resource.openChange();
        }
    }
    async rename(repository, fromUri) {
        var _a;
        fromUri = fromUri !== null && fromUri !== void 0 ? fromUri : (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri;
        if (!fromUri) {
            return;
        }
        const from = path.relative(repository.root, fromUri.fsPath);
        let to = await vscode_1.window.showInputBox({
            value: from,
            valueSelection: [from.length - path.basename(from).length, from.length]
        });
        to = to === null || to === void 0 ? void 0 : to.trim();
        if (!to) {
            return;
        }
        await repository.move(from, to);
    }
    async stage(...resourceStates) {
        this.outputChannel.appendLine(`git.stage ${resourceStates.length}`);
        resourceStates = resourceStates.filter(s => !!s);
        if (resourceStates.length === 0 || (resourceStates[0] && !(resourceStates[0].resourceUri instanceof vscode_1.Uri))) {
            const resource = this.getSCMResource();
            this.outputChannel.appendLine(`git.stage.getSCMResource ${resource ? resource.resourceUri.toString() : null}`);
            if (!resource) {
                return;
            }
            resourceStates = [resource];
        }
        const selection = resourceStates.filter(s => s instanceof repository_1.Resource);
        const { resolved, unresolved, deletionConflicts } = await categorizeResourceByResolution(selection);
        if (unresolved.length > 0) {
            const message = unresolved.length > 1
                ? localize('confirm stage files with merge conflicts', "Are you sure you want to stage {0} files with merge conflicts?", unresolved.length)
                : localize('confirm stage file with merge conflicts', "Are you sure you want to stage {0} with merge conflicts?", path.basename(unresolved[0].resourceUri.fsPath));
            const yes = localize('yes', "Yes");
            const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes);
            if (pick !== yes) {
                return;
            }
        }
        try {
            await this.runByRepository(deletionConflicts.map(r => r.resourceUri), async (repository, resources) => {
                for (const resource of resources) {
                    await this._stageDeletionConflict(repository, resource);
                }
            });
        }
        catch (err) {
            if (/Cancelled/.test(err.message)) {
                return;
            }
            throw err;
        }
        const workingTree = selection.filter(s => s.resourceGroupType === 2);
        const untracked = selection.filter(s => s.resourceGroupType === 3);
        const scmResources = [...workingTree, ...untracked, ...resolved, ...unresolved];
        this.outputChannel.appendLine(`git.stage.scmResources ${scmResources.length}`);
        if (!scmResources.length) {
            return;
        }
        const resources = scmResources.map(r => r.resourceUri);
        await this.runByRepository(resources, async (repository, resources) => repository.add(resources));
    }
    async stageAll(repository) {
        const resources = [...repository.workingTreeGroup.resourceStates, ...repository.untrackedGroup.resourceStates];
        const uris = resources.map(r => r.resourceUri);
        if (uris.length > 0) {
            const config = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(repository.root));
            const untrackedChanges = config.get('untrackedChanges');
            await repository.add(uris, untrackedChanges === 'mixed' ? undefined : { update: true });
        }
    }
    async _stageDeletionConflict(repository, uri) {
        const uriString = uri.toString();
        const resource = repository.mergeGroup.resourceStates.filter(r => r.resourceUri.toString() === uriString)[0];
        if (!resource) {
            return;
        }
        if (resource.type === 13) {
            const keepIt = localize('keep ours', "Keep Our Version");
            const deleteIt = localize('delete', "Delete File");
            const result = await vscode_1.window.showInformationMessage(localize('deleted by them', "File '{0}' was deleted by them and modified by us.\n\nWhat would you like to do?", path.basename(uri.fsPath)), { modal: true }, keepIt, deleteIt);
            if (result === keepIt) {
                await repository.add([uri]);
            }
            else if (result === deleteIt) {
                await repository.rm([uri]);
            }
            else {
                throw new Error('Cancelled');
            }
        }
        else if (resource.type === 12) {
            const keepIt = localize('keep theirs', "Keep Their Version");
            const deleteIt = localize('delete', "Delete File");
            const result = await vscode_1.window.showInformationMessage(localize('deleted by us', "File '{0}' was deleted by us and modified by them.\n\nWhat would you like to do?", path.basename(uri.fsPath)), { modal: true }, keepIt, deleteIt);
            if (result === keepIt) {
                await repository.add([uri]);
            }
            else if (result === deleteIt) {
                await repository.rm([uri]);
            }
            else {
                throw new Error('Cancelled');
            }
        }
    }
    async stageAllTracked(repository) {
        const resources = repository.workingTreeGroup.resourceStates
            .filter(r => r.type !== 7 && r.type !== 8);
        const uris = resources.map(r => r.resourceUri);
        await repository.add(uris);
    }
    async stageAllUntracked(repository) {
        const resources = [...repository.workingTreeGroup.resourceStates, ...repository.untrackedGroup.resourceStates]
            .filter(r => r.type === 7 || r.type === 8);
        const uris = resources.map(r => r.resourceUri);
        await repository.add(uris);
    }
    async stageAllMerge(repository) {
        const resources = repository.mergeGroup.resourceStates.filter(s => s instanceof repository_1.Resource);
        const { merge, unresolved, deletionConflicts } = await categorizeResourceByResolution(resources);
        try {
            for (const deletionConflict of deletionConflicts) {
                await this._stageDeletionConflict(repository, deletionConflict.resourceUri);
            }
        }
        catch (err) {
            if (/Cancelled/.test(err.message)) {
                return;
            }
            throw err;
        }
        if (unresolved.length > 0) {
            const message = unresolved.length > 1
                ? localize('confirm stage files with merge conflicts', "Are you sure you want to stage {0} files with merge conflicts?", merge.length)
                : localize('confirm stage file with merge conflicts', "Are you sure you want to stage {0} with merge conflicts?", path.basename(merge[0].resourceUri.fsPath));
            const yes = localize('yes', "Yes");
            const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes);
            if (pick !== yes) {
                return;
            }
        }
        const uris = resources.map(r => r.resourceUri);
        if (uris.length > 0) {
            await repository.add(uris);
        }
    }
    async stageChange(uri, changes, index) {
        if (!uri) {
            return;
        }
        const textEditor = vscode_1.window.visibleTextEditors.filter(e => e.document.uri.toString() === uri.toString())[0];
        if (!textEditor) {
            return;
        }
        await this._stageChanges(textEditor, [changes[index]]);
        const firstStagedLine = changes[index].modifiedStartLineNumber - 1;
        textEditor.selections = [new vscode_1.Selection(firstStagedLine, 0, firstStagedLine, 0)];
    }
    async stageSelectedChanges(changes) {
        const textEditor = vscode_1.window.activeTextEditor;
        if (!textEditor) {
            return;
        }
        const modifiedDocument = textEditor.document;
        const selectedLines = (0, staging_1.toLineRanges)(textEditor.selections, modifiedDocument);
        const selectedChanges = changes
            .map(diff => selectedLines.reduce((result, range) => result || (0, staging_1.intersectDiffWithRange)(modifiedDocument, diff, range), null))
            .filter(d => !!d);
        if (!selectedChanges.length) {
            return;
        }
        await this._stageChanges(textEditor, selectedChanges);
    }
    async _stageChanges(textEditor, changes) {
        const modifiedDocument = textEditor.document;
        const modifiedUri = modifiedDocument.uri;
        if (modifiedUri.scheme !== 'file') {
            return;
        }
        const originalUri = (0, uri_1.toGitUri)(modifiedUri, '~');
        const originalDocument = await vscode_1.workspace.openTextDocument(originalUri);
        const result = (0, staging_1.applyLineChanges)(originalDocument, modifiedDocument, changes);
        await this.runByRepository(modifiedUri, async (repository, resource) => await repository.stage(resource, result));
    }
    async revertChange(uri, changes, index) {
        if (!uri) {
            return;
        }
        const textEditor = vscode_1.window.visibleTextEditors.filter(e => e.document.uri.toString() === uri.toString())[0];
        if (!textEditor) {
            return;
        }
        await this._revertChanges(textEditor, [...changes.slice(0, index), ...changes.slice(index + 1)]);
        const firstStagedLine = changes[index].modifiedStartLineNumber - 1;
        textEditor.selections = [new vscode_1.Selection(firstStagedLine, 0, firstStagedLine, 0)];
    }
    async revertSelectedRanges(changes) {
        const textEditor = vscode_1.window.activeTextEditor;
        if (!textEditor) {
            return;
        }
        const modifiedDocument = textEditor.document;
        const selections = textEditor.selections;
        const selectedChanges = changes.filter(change => {
            const modifiedRange = (0, staging_1.getModifiedRange)(modifiedDocument, change);
            return selections.every(selection => !selection.intersection(modifiedRange));
        });
        if (selectedChanges.length === changes.length) {
            return;
        }
        const selectionsBeforeRevert = textEditor.selections;
        await this._revertChanges(textEditor, selectedChanges);
        textEditor.selections = selectionsBeforeRevert;
    }
    async _revertChanges(textEditor, changes) {
        const modifiedDocument = textEditor.document;
        const modifiedUri = modifiedDocument.uri;
        if (modifiedUri.scheme !== 'file') {
            return;
        }
        const originalUri = (0, uri_1.toGitUri)(modifiedUri, '~');
        const originalDocument = await vscode_1.workspace.openTextDocument(originalUri);
        const visibleRangesBeforeRevert = textEditor.visibleRanges;
        const result = (0, staging_1.applyLineChanges)(originalDocument, modifiedDocument, changes);
        const edit = new vscode_1.WorkspaceEdit();
        edit.replace(modifiedUri, new vscode_1.Range(new vscode_1.Position(0, 0), modifiedDocument.lineAt(modifiedDocument.lineCount - 1).range.end), result);
        vscode_1.workspace.applyEdit(edit);
        await modifiedDocument.save();
        textEditor.revealRange(visibleRangesBeforeRevert[0]);
    }
    async unstage(...resourceStates) {
        resourceStates = resourceStates.filter(s => !!s);
        if (resourceStates.length === 0 || (resourceStates[0] && !(resourceStates[0].resourceUri instanceof vscode_1.Uri))) {
            const resource = this.getSCMResource();
            if (!resource) {
                return;
            }
            resourceStates = [resource];
        }
        const scmResources = resourceStates
            .filter(s => s instanceof repository_1.Resource && s.resourceGroupType === 1);
        if (!scmResources.length) {
            return;
        }
        const resources = scmResources.map(r => r.resourceUri);
        await this.runByRepository(resources, async (repository, resources) => repository.revert(resources));
    }
    async unstageAll(repository) {
        await repository.revert([]);
    }
    async unstageSelectedRanges(diffs) {
        const textEditor = vscode_1.window.activeTextEditor;
        if (!textEditor) {
            return;
        }
        const modifiedDocument = textEditor.document;
        const modifiedUri = modifiedDocument.uri;
        if (!(0, uri_1.isGitUri)(modifiedUri)) {
            return;
        }
        const { ref } = (0, uri_1.fromGitUri)(modifiedUri);
        if (ref !== '') {
            return;
        }
        const originalUri = (0, uri_1.toGitUri)(modifiedUri, 'HEAD');
        const originalDocument = await vscode_1.workspace.openTextDocument(originalUri);
        const selectedLines = (0, staging_1.toLineRanges)(textEditor.selections, modifiedDocument);
        const selectedDiffs = diffs
            .map(diff => selectedLines.reduce((result, range) => result || (0, staging_1.intersectDiffWithRange)(modifiedDocument, diff, range), null))
            .filter(d => !!d);
        if (!selectedDiffs.length) {
            return;
        }
        const invertedDiffs = selectedDiffs.map(staging_1.invertLineChange);
        const result = (0, staging_1.applyLineChanges)(modifiedDocument, originalDocument, invertedDiffs);
        await this.runByRepository(modifiedUri, async (repository, resource) => await repository.stage(resource, result));
    }
    async clean(...resourceStates) {
        resourceStates = resourceStates.filter(s => !!s);
        if (resourceStates.length === 0 || (resourceStates[0] && !(resourceStates[0].resourceUri instanceof vscode_1.Uri))) {
            const resource = this.getSCMResource();
            if (!resource) {
                return;
            }
            resourceStates = [resource];
        }
        const scmResources = resourceStates.filter(s => s instanceof repository_1.Resource
            && (s.resourceGroupType === 2 || s.resourceGroupType === 3));
        if (!scmResources.length) {
            return;
        }
        const untrackedCount = scmResources.reduce((s, r) => s + (r.type === 7 ? 1 : 0), 0);
        let message;
        let yes = localize('discard', "Discard Changes");
        if (scmResources.length === 1) {
            if (untrackedCount > 0) {
                message = localize('confirm delete', "Are you sure you want to DELETE {0}?\nThis is IRREVERSIBLE!\nThis file will be FOREVER LOST if you proceed.", path.basename(scmResources[0].resourceUri.fsPath));
                yes = localize('delete file', "Delete file");
            }
            else {
                if (scmResources[0].type === 6) {
                    yes = localize('restore file', "Restore file");
                    message = localize('confirm restore', "Are you sure you want to restore {0}?", path.basename(scmResources[0].resourceUri.fsPath));
                }
                else {
                    message = localize('confirm discard', "Are you sure you want to discard changes in {0}?", path.basename(scmResources[0].resourceUri.fsPath));
                }
            }
        }
        else {
            if (scmResources.every(resource => resource.type === 6)) {
                yes = localize('restore files', "Restore files");
                message = localize('confirm restore multiple', "Are you sure you want to restore {0} files?", scmResources.length);
            }
            else {
                message = localize('confirm discard multiple', "Are you sure you want to discard changes in {0} files?", scmResources.length);
            }
            if (untrackedCount > 0) {
                message = `${message}\n\n${localize('warn untracked', "This will DELETE {0} untracked files!\nThis is IRREVERSIBLE!\nThese files will be FOREVER LOST.", untrackedCount)}`;
            }
        }
        const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes);
        if (pick !== yes) {
            return;
        }
        const resources = scmResources.map(r => r.resourceUri);
        await this.runByRepository(resources, async (repository, resources) => repository.clean(resources));
    }
    async cleanAll(repository) {
        let resources = repository.workingTreeGroup.resourceStates;
        if (resources.length === 0) {
            return;
        }
        const trackedResources = resources.filter(r => r.type !== 7 && r.type !== 8);
        const untrackedResources = resources.filter(r => r.type === 7 || r.type === 8);
        if (untrackedResources.length === 0) {
            await this._cleanTrackedChanges(repository, resources);
        }
        else if (resources.length === 1) {
            await this._cleanUntrackedChange(repository, resources[0]);
        }
        else if (trackedResources.length === 0) {
            await this._cleanUntrackedChanges(repository, resources);
        }
        else {
            const untrackedMessage = untrackedResources.length === 1
                ? localize('there are untracked files single', "The following untracked file will be DELETED FROM DISK if discarded: {0}.", path.basename(untrackedResources[0].resourceUri.fsPath))
                : localize('there are untracked files', "There are {0} untracked files which will be DELETED FROM DISK if discarded.", untrackedResources.length);
            const message = localize('confirm discard all 2', "{0}\n\nThis is IRREVERSIBLE, your current working set will be FOREVER LOST.", untrackedMessage, resources.length);
            const yesTracked = trackedResources.length === 1
                ? localize('yes discard tracked', "Discard 1 Tracked File", trackedResources.length)
                : localize('yes discard tracked multiple', "Discard {0} Tracked Files", trackedResources.length);
            const yesAll = localize('discardAll', "Discard All {0} Files", resources.length);
            const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yesTracked, yesAll);
            if (pick === yesTracked) {
                resources = trackedResources;
            }
            else if (pick !== yesAll) {
                return;
            }
            await repository.clean(resources.map(r => r.resourceUri));
        }
    }
    async cleanAllTracked(repository) {
        const resources = repository.workingTreeGroup.resourceStates
            .filter(r => r.type !== 7 && r.type !== 8);
        if (resources.length === 0) {
            return;
        }
        await this._cleanTrackedChanges(repository, resources);
    }
    async cleanAllUntracked(repository) {
        const resources = [...repository.workingTreeGroup.resourceStates, ...repository.untrackedGroup.resourceStates]
            .filter(r => r.type === 7 || r.type === 8);
        if (resources.length === 0) {
            return;
        }
        if (resources.length === 1) {
            await this._cleanUntrackedChange(repository, resources[0]);
        }
        else {
            await this._cleanUntrackedChanges(repository, resources);
        }
    }
    async _cleanTrackedChanges(repository, resources) {
        const message = resources.length === 1
            ? localize('confirm discard all single', "Are you sure you want to discard changes in {0}?", path.basename(resources[0].resourceUri.fsPath))
            : localize('confirm discard all', "Are you sure you want to discard ALL changes in {0} files?\nThis is IRREVERSIBLE!\nYour current working set will be FOREVER LOST if you proceed.", resources.length);
        const yes = resources.length === 1
            ? localize('discardAll multiple', "Discard 1 File")
            : localize('discardAll', "Discard All {0} Files", resources.length);
        const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes);
        if (pick !== yes) {
            return;
        }
        await repository.clean(resources.map(r => r.resourceUri));
    }
    async _cleanUntrackedChange(repository, resource) {
        const message = localize('confirm delete', "Are you sure you want to DELETE {0}?\nThis is IRREVERSIBLE!\nThis file will be FOREVER LOST if you proceed.", path.basename(resource.resourceUri.fsPath));
        const yes = localize('delete file', "Delete file");
        const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes);
        if (pick !== yes) {
            return;
        }
        await repository.clean([resource.resourceUri]);
    }
    async _cleanUntrackedChanges(repository, resources) {
        const message = localize('confirm delete multiple', "Are you sure you want to DELETE {0} files?\nThis is IRREVERSIBLE!\nThese files will be FOREVER LOST if you proceed.", resources.length);
        const yes = localize('delete files', "Delete Files");
        const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes);
        if (pick !== yes) {
            return;
        }
        await repository.clean(resources.map(r => r.resourceUri));
    }
    async smartCommit(repository, getCommitMessage, opts) {
        const config = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(repository.root));
        let promptToSaveFilesBeforeCommit = config.get('promptToSaveFilesBeforeCommit');
        if (promptToSaveFilesBeforeCommit === true) {
            promptToSaveFilesBeforeCommit = 'always';
        }
        else if (promptToSaveFilesBeforeCommit === false) {
            promptToSaveFilesBeforeCommit = 'never';
        }
        const enableSmartCommit = config.get('enableSmartCommit') === true;
        const enableCommitSigning = config.get('enableCommitSigning') === true;
        let noStagedChanges = repository.indexGroup.resourceStates.length === 0;
        let noUnstagedChanges = repository.workingTreeGroup.resourceStates.length === 0;
        if (promptToSaveFilesBeforeCommit !== 'never') {
            let documents = vscode_1.workspace.textDocuments
                .filter(d => !d.isUntitled && d.isDirty && (0, util_1.isDescendant)(repository.root, d.uri.fsPath));
            if (promptToSaveFilesBeforeCommit === 'staged' || repository.indexGroup.resourceStates.length > 0) {
                documents = documents
                    .filter(d => repository.indexGroup.resourceStates.some(s => (0, util_1.pathEquals)(s.resourceUri.fsPath, d.uri.fsPath)));
            }
            if (documents.length > 0) {
                const message = documents.length === 1
                    ? localize('unsaved files single', "The following file has unsaved changes which won't be included in the commit if you proceed: {0}.\n\nWould you like to save it before committing?", path.basename(documents[0].uri.fsPath))
                    : localize('unsaved files', "There are {0} unsaved files.\n\nWould you like to save them before committing?", documents.length);
                const saveAndCommit = localize('save and commit', "Save All & Commit");
                const commit = localize('commit', "Commit Staged Changes");
                const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, saveAndCommit, commit);
                if (pick === saveAndCommit) {
                    await Promise.all(documents.map(d => d.save()));
                    await repository.add(documents.map(d => d.uri));
                    noStagedChanges = repository.indexGroup.resourceStates.length === 0;
                    noUnstagedChanges = repository.workingTreeGroup.resourceStates.length === 0;
                }
                else if (pick !== commit) {
                    return false;
                }
            }
        }
        if (!opts) {
            opts = { all: noStagedChanges };
        }
        else if (!opts.all && noStagedChanges && !opts.empty) {
            opts = Object.assign(Object.assign({}, opts), { all: true });
        }
        if (!noUnstagedChanges && noStagedChanges && !enableSmartCommit && !opts.empty) {
            const suggestSmartCommit = config.get('suggestSmartCommit') === true;
            if (!suggestSmartCommit) {
                return false;
            }
            const message = localize('no staged changes', "There are no staged changes to commit.\n\nWould you like to stage all your changes and commit them directly?");
            const yes = localize('yes', "Yes");
            const always = localize('always', "Always");
            const never = localize('never', "Never");
            const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes, always, never);
            if (pick === always) {
                config.update('enableSmartCommit', true, true);
            }
            else if (pick === never) {
                config.update('suggestSmartCommit', false, true);
                return false;
            }
            else if (pick !== yes) {
                return false;
            }
        }
        opts.signCommit = enableCommitSigning;
        if (config.get('alwaysSignOff')) {
            opts.signoff = true;
        }
        const smartCommitChanges = config.get('smartCommitChanges');
        if (((noStagedChanges && noUnstagedChanges)
            || (!opts.all && noStagedChanges)
            || (noStagedChanges && smartCommitChanges === 'tracked' && repository.workingTreeGroup.resourceStates.every(r => r.type === 7)))
            && !opts.amend
            && !opts.empty) {
            const commitAnyway = localize('commit anyway', "Create Empty Commit");
            const answer = await vscode_1.window.showInformationMessage(localize('no changes', "There are no changes to commit."), commitAnyway);
            if (answer !== commitAnyway) {
                return false;
            }
            opts.empty = true;
        }
        if (opts.noVerify) {
            if (!config.get('allowNoVerifyCommit')) {
                await vscode_1.window.showErrorMessage(localize('no verify commit not allowed', "Commits without verification are not allowed, please enable them with the 'git.allowNoVerifyCommit' setting."));
                return false;
            }
            if (config.get('confirmNoVerifyCommit')) {
                const message = localize('confirm no verify commit', "You are about to commit your changes without verification, this skips pre-commit hooks and can be undesirable.\n\nAre you sure to continue?");
                const yes = localize('ok', "OK");
                const neverAgain = localize('never ask again', "OK, Don't Ask Again");
                const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes, neverAgain);
                if (pick === neverAgain) {
                    config.update('confirmNoVerifyCommit', false, true);
                }
                else if (pick !== yes) {
                    return false;
                }
            }
        }
        let message = await getCommitMessage();
        if (!message && !opts.amend) {
            return false;
        }
        if (opts.all && smartCommitChanges === 'tracked') {
            opts.all = 'tracked';
        }
        if (opts.all && config.get('untrackedChanges') !== 'mixed') {
            opts.all = 'tracked';
        }
        await repository.commit(message, opts);
        const postCommitCommand = config.get('postCommitCommand');
        switch (postCommitCommand) {
            case 'push':
                await this._push(repository, { pushType: PushType.Push, silent: true });
                break;
            case 'sync':
                await this.sync(repository);
                break;
        }
        return true;
    }
    async commitWithAnyInput(repository, opts) {
        const message = repository.inputBox.value;
        const getCommitMessage = async () => {
            let _message = message;
            if (!_message) {
                let value = undefined;
                if (opts && opts.amend && repository.HEAD && repository.HEAD.commit) {
                    return undefined;
                }
                const branchName = repository.headShortName;
                let placeHolder;
                if (branchName) {
                    placeHolder = localize('commitMessageWithHeadLabel2', "Message (commit on '{0}')", branchName);
                }
                else {
                    placeHolder = localize('commit message', "Commit message");
                }
                _message = await vscode_1.window.showInputBox({
                    value,
                    placeHolder,
                    prompt: localize('provide commit message', "Please provide a commit message"),
                    ignoreFocusOut: true
                });
            }
            return _message;
        };
        const didCommit = await this.smartCommit(repository, getCommitMessage, opts);
        if (message && didCommit) {
            repository.inputBox.value = await repository.getInputTemplate();
        }
    }
    async commit(repository) {
        await this.commitWithAnyInput(repository);
    }
    async commitStaged(repository) {
        await this.commitWithAnyInput(repository, { all: false });
    }
    async commitStagedSigned(repository) {
        await this.commitWithAnyInput(repository, { all: false, signoff: true });
    }
    async commitStagedAmend(repository) {
        await this.commitWithAnyInput(repository, { all: false, amend: true });
    }
    async commitAll(repository) {
        await this.commitWithAnyInput(repository, { all: true });
    }
    async commitAllSigned(repository) {
        await this.commitWithAnyInput(repository, { all: true, signoff: true });
    }
    async commitAllAmend(repository) {
        await this.commitWithAnyInput(repository, { all: true, amend: true });
    }
    async _commitEmpty(repository, noVerify) {
        const root = vscode_1.Uri.file(repository.root);
        const config = vscode_1.workspace.getConfiguration('git', root);
        const shouldPrompt = config.get('confirmEmptyCommits') === true;
        if (shouldPrompt) {
            const message = localize('confirm emtpy commit', "Are you sure you want to create an empty commit?");
            const yes = localize('yes', "Yes");
            const neverAgain = localize('yes never again', "Yes, Don't Show Again");
            const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes, neverAgain);
            if (pick === neverAgain) {
                await config.update('confirmEmptyCommits', false, true);
            }
            else if (pick !== yes) {
                return;
            }
        }
        await this.commitWithAnyInput(repository, { empty: true, noVerify });
    }
    async commitEmpty(repository) {
        await this._commitEmpty(repository);
    }
    async commitNoVerify(repository) {
        await this.commitWithAnyInput(repository, { noVerify: true });
    }
    async commitStagedNoVerify(repository) {
        await this.commitWithAnyInput(repository, { all: false, noVerify: true });
    }
    async commitStagedSignedNoVerify(repository) {
        await this.commitWithAnyInput(repository, { all: false, signoff: true, noVerify: true });
    }
    async commitStagedAmendNoVerify(repository) {
        await this.commitWithAnyInput(repository, { all: false, amend: true, noVerify: true });
    }
    async commitAllNoVerify(repository) {
        await this.commitWithAnyInput(repository, { all: true, noVerify: true });
    }
    async commitAllSignedNoVerify(repository) {
        await this.commitWithAnyInput(repository, { all: true, signoff: true, noVerify: true });
    }
    async commitAllAmendNoVerify(repository) {
        await this.commitWithAnyInput(repository, { all: true, amend: true, noVerify: true });
    }
    async commitEmptyNoVerify(repository) {
        await this._commitEmpty(repository, true);
    }
    async restoreCommitTemplate(repository) {
        repository.inputBox.value = await repository.getCommitTemplate();
    }
    async undoCommit(repository) {
        const HEAD = repository.HEAD;
        if (!HEAD || !HEAD.commit) {
            vscode_1.window.showWarningMessage(localize('no more', "Can't undo because HEAD doesn't point to any commit."));
            return;
        }
        const commit = await repository.getCommit('HEAD');
        if (commit.parents.length > 1) {
            const yes = localize('undo commit', "Undo merge commit");
            const result = await vscode_1.window.showWarningMessage(localize('merge commit', "The last commit was a merge commit. Are you sure you want to undo it?"), { modal: true }, yes);
            if (result !== yes) {
                return;
            }
        }
        if (commit.parents.length > 0) {
            await repository.reset('HEAD~');
        }
        else {
            await repository.deleteRef('HEAD');
            await this.unstageAll(repository);
        }
        repository.inputBox.value = commit.message;
    }
    async checkout(repository, treeish) {
        return this._checkout(repository, { treeish });
    }
    async checkoutDetached(repository, treeish) {
        return this._checkout(repository, { detached: true, treeish });
    }
    async _checkout(repository, opts) {
        if (typeof (opts === null || opts === void 0 ? void 0 : opts.treeish) === 'string') {
            await repository.checkout(opts === null || opts === void 0 ? void 0 : opts.treeish, opts);
            return true;
        }
        const createBranch = new CreateBranchItem();
        const createBranchFrom = new CreateBranchFromItem();
        const checkoutDetached = new CheckoutDetachedItem();
        const picks = [];
        if (!(opts === null || opts === void 0 ? void 0 : opts.detached)) {
            picks.push(createBranch, createBranchFrom, checkoutDetached);
        }
        picks.push(...createCheckoutItems(repository));
        const quickpick = vscode_1.window.createQuickPick();
        quickpick.items = picks;
        quickpick.placeholder = (opts === null || opts === void 0 ? void 0 : opts.detached)
            ? localize('select a ref to checkout detached', 'Select a ref to checkout in detached mode')
            : localize('select a ref to checkout', 'Select a ref to checkout');
        quickpick.show();
        const choice = await new Promise(c => quickpick.onDidAccept(() => c(quickpick.activeItems[0])));
        quickpick.hide();
        if (!choice) {
            return false;
        }
        if (choice === createBranch) {
            await this._branch(repository, quickpick.value);
        }
        else if (choice === createBranchFrom) {
            await this._branch(repository, quickpick.value, true);
        }
        else if (choice === checkoutDetached) {
            return this._checkout(repository, { detached: true });
        }
        else {
            const item = choice;
            try {
                await item.run(repository, opts);
            }
            catch (err) {
                if (err.gitErrorCode !== "DirtyWorkTree") {
                    throw err;
                }
                const force = localize('force', "Force Checkout");
                const stash = localize('stashcheckout', "Stash & Checkout");
                const choice = await vscode_1.window.showWarningMessage(localize('local changes', "Your local changes would be overwritten by checkout."), { modal: true }, force, stash);
                if (choice === force) {
                    await this.cleanAll(repository);
                    await item.run(repository, opts);
                }
                else if (choice === stash) {
                    await this.stash(repository);
                    await item.run(repository, opts);
                    await this.stashPopLatest(repository);
                }
            }
        }
        return true;
    }
    async branch(repository) {
        await this._branch(repository);
    }
    async branchFrom(repository) {
        await this._branch(repository, undefined, true);
    }
    async promptForBranchName(defaultName, initialValue) {
        const config = vscode_1.workspace.getConfiguration('git');
        const branchWhitespaceChar = config.get('branchWhitespaceChar');
        const branchValidationRegex = config.get('branchValidationRegex');
        const sanitize = (name) => name ?
            name.trim().replace(/^-+/, '').replace(/^\.|\/\.|\.\.|~|\^|:|\/$|\.lock$|\.lock\/|\\|\*|\s|^\s*$|\.$|\[|\]$/g, branchWhitespaceChar)
            : name;
        const rawBranchName = defaultName || await vscode_1.window.showInputBox({
            placeHolder: localize('branch name', "Branch name"),
            prompt: localize('provide branch name', "Please provide a new branch name"),
            value: initialValue,
            ignoreFocusOut: true,
            validateInput: (name) => {
                const validateName = new RegExp(branchValidationRegex);
                if (validateName.test(sanitize(name))) {
                    return null;
                }
                return localize('branch name format invalid', "Branch name needs to match regex: {0}", branchValidationRegex);
            }
        });
        return sanitize(rawBranchName || '');
    }
    async _branch(repository, defaultName, from = false) {
        const branchName = await this.promptForBranchName(defaultName);
        if (!branchName) {
            return;
        }
        let target = 'HEAD';
        if (from) {
            const picks = [new HEADItem(repository), ...createCheckoutItems(repository)];
            const placeHolder = localize('select a ref to create a new branch from', 'Select a ref to create the \'{0}\' branch from', branchName);
            const choice = await vscode_1.window.showQuickPick(picks, { placeHolder });
            if (!choice) {
                return;
            }
            target = choice.label;
        }
        await repository.branch(branchName, true, target);
    }
    async deleteBranch(repository, name, force) {
        let run;
        if (typeof name === 'string') {
            run = force => repository.deleteBranch(name, force);
        }
        else {
            const currentHead = repository.HEAD && repository.HEAD.name;
            const heads = repository.refs.filter(ref => ref.type === 0 && ref.name !== currentHead)
                .map(ref => new BranchDeleteItem(ref));
            const placeHolder = localize('select branch to delete', 'Select a branch to delete');
            const choice = await vscode_1.window.showQuickPick(heads, { placeHolder });
            if (!choice || !choice.branchName) {
                return;
            }
            name = choice.branchName;
            run = force => choice.run(repository, force);
        }
        try {
            await run(force);
        }
        catch (err) {
            if (err.gitErrorCode !== "BranchNotFullyMerged") {
                throw err;
            }
            const message = localize('confirm force delete branch', "The branch '{0}' is not fully merged. Delete anyway?", name);
            const yes = localize('delete branch', "Delete Branch");
            const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes);
            if (pick === yes) {
                await run(true);
            }
        }
    }
    async renameBranch(repository) {
        const currentBranchName = repository.HEAD && repository.HEAD.name;
        const branchName = await this.promptForBranchName(undefined, currentBranchName);
        if (!branchName) {
            return;
        }
        try {
            await repository.renameBranch(branchName);
        }
        catch (err) {
            switch (err.gitErrorCode) {
                case "InvalidBranchName":
                    vscode_1.window.showErrorMessage(localize('invalid branch name', 'Invalid branch name'));
                    return;
                case "BranchAlreadyExists":
                    vscode_1.window.showErrorMessage(localize('branch already exists', "A branch named '{0}' already exists", branchName));
                    return;
                default:
                    throw err;
            }
        }
    }
    async merge(repository) {
        const config = vscode_1.workspace.getConfiguration('git');
        const checkoutType = config.get('checkoutType');
        const includeRemotes = checkoutType === 'all' || checkoutType === 'remote' || (checkoutType === null || checkoutType === void 0 ? void 0 : checkoutType.includes('remote'));
        const heads = repository.refs.filter(ref => ref.type === 0)
            .filter(ref => ref.name || ref.commit)
            .map(ref => new MergeItem(ref));
        const remoteHeads = (includeRemotes ? repository.refs.filter(ref => ref.type === 1) : [])
            .filter(ref => ref.name || ref.commit)
            .map(ref => new MergeItem(ref));
        const picks = [...heads, ...remoteHeads];
        const placeHolder = localize('select a branch to merge from', 'Select a branch to merge from');
        const choice = await vscode_1.window.showQuickPick(picks, { placeHolder });
        if (!choice) {
            return;
        }
        await choice.run(repository);
    }
    async rebase(repository) {
        var _a, _b, _c;
        const config = vscode_1.workspace.getConfiguration('git');
        const checkoutType = config.get('checkoutType');
        const includeRemotes = checkoutType === 'all' || checkoutType === 'remote' || (checkoutType === null || checkoutType === void 0 ? void 0 : checkoutType.includes('remote'));
        const heads = repository.refs.filter(ref => ref.type === 0)
            .filter(ref => { var _a; return ref.name !== ((_a = repository.HEAD) === null || _a === void 0 ? void 0 : _a.name); })
            .filter(ref => ref.name || ref.commit);
        const remoteHeads = (includeRemotes ? repository.refs.filter(ref => ref.type === 1) : [])
            .filter(ref => ref.name || ref.commit);
        const picks = [...heads, ...remoteHeads]
            .map(ref => new RebaseItem(ref));
        if ((_a = repository.HEAD) === null || _a === void 0 ? void 0 : _a.upstream) {
            const upstreamName = `${(_b = repository.HEAD) === null || _b === void 0 ? void 0 : _b.upstream.remote}/${(_c = repository.HEAD) === null || _c === void 0 ? void 0 : _c.upstream.name}`;
            const index = picks.findIndex(e => e.ref.name === upstreamName);
            if (index > -1) {
                const [ref] = picks.splice(index, 1);
                ref.description = '(upstream)';
                picks.unshift(ref);
            }
        }
        const placeHolder = localize('select a branch to rebase onto', 'Select a branch to rebase onto');
        const choice = await vscode_1.window.showQuickPick(picks, { placeHolder });
        if (!choice) {
            return;
        }
        await choice.run(repository);
    }
    async createTag(repository) {
        const inputTagName = await vscode_1.window.showInputBox({
            placeHolder: localize('tag name', "Tag name"),
            prompt: localize('provide tag name', "Please provide a tag name"),
            ignoreFocusOut: true
        });
        if (!inputTagName) {
            return;
        }
        const inputMessage = await vscode_1.window.showInputBox({
            placeHolder: localize('tag message', "Message"),
            prompt: localize('provide tag message', "Please provide a message to annotate the tag"),
            ignoreFocusOut: true
        });
        const name = inputTagName.replace(/^\.|\/\.|\.\.|~|\^|:|\/$|\.lock$|\.lock\/|\\|\*|\s|^\s*$|\.$/g, '-');
        await repository.tag(name, inputMessage);
    }
    async deleteTag(repository) {
        const picks = repository.refs.filter(ref => ref.type === 2)
            .map(ref => new TagItem(ref));
        if (picks.length === 0) {
            vscode_1.window.showWarningMessage(localize('no tags', "This repository has no tags."));
            return;
        }
        const placeHolder = localize('select a tag to delete', 'Select a tag to delete');
        const choice = await vscode_1.window.showQuickPick(picks, { placeHolder });
        if (!choice) {
            return;
        }
        await repository.deleteTag(choice.label);
    }
    async fetch(repository) {
        if (repository.remotes.length === 0) {
            vscode_1.window.showWarningMessage(localize('no remotes to fetch', "This repository has no remotes configured to fetch from."));
            return;
        }
        await repository.fetchDefault();
    }
    async fetchPrune(repository) {
        if (repository.remotes.length === 0) {
            vscode_1.window.showWarningMessage(localize('no remotes to fetch', "This repository has no remotes configured to fetch from."));
            return;
        }
        await repository.fetchPrune();
    }
    async fetchAll(repository) {
        if (repository.remotes.length === 0) {
            vscode_1.window.showWarningMessage(localize('no remotes to fetch', "This repository has no remotes configured to fetch from."));
            return;
        }
        await repository.fetchAll();
    }
    async pullFrom(repository) {
        const remotes = repository.remotes;
        if (remotes.length === 0) {
            vscode_1.window.showWarningMessage(localize('no remotes to pull', "Your repository has no remotes configured to pull from."));
            return;
        }
        const remotePicks = remotes.filter(r => r.fetchUrl !== undefined).map(r => ({ label: r.name, description: r.fetchUrl }));
        const placeHolder = localize('pick remote pull repo', "Pick a remote to pull the branch from");
        const remotePick = await vscode_1.window.showQuickPick(remotePicks, { placeHolder });
        if (!remotePick) {
            return;
        }
        const remoteRefs = repository.refs;
        const remoteRefsFiltered = remoteRefs.filter(r => (r.remote === remotePick.label));
        const branchPicks = remoteRefsFiltered.map(r => ({ label: r.name }));
        const branchPlaceHolder = localize('pick branch pull', "Pick a branch to pull from");
        const branchPick = await vscode_1.window.showQuickPick(branchPicks, { placeHolder: branchPlaceHolder });
        if (!branchPick) {
            return;
        }
        const remoteCharCnt = remotePick.label.length;
        await repository.pullFrom(false, remotePick.label, branchPick.label.slice(remoteCharCnt + 1));
    }
    async pull(repository) {
        const remotes = repository.remotes;
        if (remotes.length === 0) {
            vscode_1.window.showWarningMessage(localize('no remotes to pull', "Your repository has no remotes configured to pull from."));
            return;
        }
        await repository.pull(repository.HEAD);
    }
    async pullRebase(repository) {
        const remotes = repository.remotes;
        if (remotes.length === 0) {
            vscode_1.window.showWarningMessage(localize('no remotes to pull', "Your repository has no remotes configured to pull from."));
            return;
        }
        await repository.pullWithRebase(repository.HEAD);
    }
    async _push(repository, pushOptions) {
        var _a;
        const remotes = repository.remotes;
        if (remotes.length === 0) {
            if (pushOptions.silent) {
                return;
            }
            const addRemote = localize('addremote', 'Add Remote');
            const result = await vscode_1.window.showWarningMessage(localize('no remotes to push', "Your repository has no remotes configured to push to."), addRemote);
            if (result === addRemote) {
                await this.addRemote(repository);
            }
            return;
        }
        const config = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(repository.root));
        let forcePushMode = undefined;
        if (pushOptions.forcePush) {
            if (!config.get('allowForcePush')) {
                await vscode_1.window.showErrorMessage(localize('force push not allowed', "Force push is not allowed, please enable it with the 'git.allowForcePush' setting."));
                return;
            }
            forcePushMode = config.get('useForcePushWithLease') === true ? 1 : 0;
            if (config.get('confirmForcePush')) {
                const message = localize('confirm force push', "You are about to force push your changes, this can be destructive and could inadvertently overwrite changes made by others.\n\nAre you sure to continue?");
                const yes = localize('ok', "OK");
                const neverAgain = localize('never ask again', "OK, Don't Ask Again");
                const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes, neverAgain);
                if (pick === neverAgain) {
                    config.update('confirmForcePush', false, true);
                }
                else if (pick !== yes) {
                    return;
                }
            }
        }
        if (pushOptions.pushType === PushType.PushFollowTags) {
            await repository.pushFollowTags(undefined, forcePushMode);
            return;
        }
        if (pushOptions.pushType === PushType.PushTags) {
            await repository.pushTags(undefined, forcePushMode);
        }
        if (!repository.HEAD || !repository.HEAD.name) {
            if (!pushOptions.silent) {
                vscode_1.window.showWarningMessage(localize('nobranch', "Please check out a branch to push to a remote."));
            }
            return;
        }
        if (pushOptions.pushType === PushType.Push) {
            try {
                await repository.push(repository.HEAD, forcePushMode);
            }
            catch (err) {
                if (err.gitErrorCode !== "NoUpstreamBranch") {
                    throw err;
                }
                if (pushOptions.silent) {
                    return;
                }
                const branchName = repository.HEAD.name;
                const message = localize('confirm publish branch', "The branch '{0}' has no upstream branch. Would you like to publish this branch?", branchName);
                const yes = localize('ok', "OK");
                const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes);
                if (pick === yes) {
                    await this.publish(repository);
                }
            }
        }
        else {
            const branchName = repository.HEAD.name;
            if (!((_a = pushOptions.pushTo) === null || _a === void 0 ? void 0 : _a.remote)) {
                const addRemote = new AddRemoteItem(this);
                const picks = [...remotes.filter(r => r.pushUrl !== undefined).map(r => ({ label: r.name, description: r.pushUrl })), addRemote];
                const placeHolder = localize('pick remote', "Pick a remote to publish the branch '{0}' to:", branchName);
                const choice = await vscode_1.window.showQuickPick(picks, { placeHolder });
                if (!choice) {
                    return;
                }
                if (choice === addRemote) {
                    const newRemote = await this.addRemote(repository);
                    if (newRemote) {
                        await repository.pushTo(newRemote, branchName, undefined, forcePushMode);
                    }
                }
                else {
                    await repository.pushTo(choice.label, branchName, undefined, forcePushMode);
                }
            }
            else {
                await repository.pushTo(pushOptions.pushTo.remote, pushOptions.pushTo.refspec || branchName, pushOptions.pushTo.setUpstream, forcePushMode);
            }
        }
    }
    async push(repository) {
        await this._push(repository, { pushType: PushType.Push });
    }
    async pushForce(repository) {
        await this._push(repository, { pushType: PushType.Push, forcePush: true });
    }
    async pushFollowTags(repository) {
        await this._push(repository, { pushType: PushType.PushFollowTags });
    }
    async pushFollowTagsForce(repository) {
        await this._push(repository, { pushType: PushType.PushFollowTags, forcePush: true });
    }
    async cherryPick(repository) {
        const hash = await vscode_1.window.showInputBox({
            placeHolder: localize('commit hash', "Commit Hash"),
            prompt: localize('provide commit hash', "Please provide the commit hash"),
            ignoreFocusOut: true
        });
        if (!hash) {
            return;
        }
        await repository.cherryPick(hash);
    }
    async pushTo(repository, remote, refspec, setUpstream) {
        await this._push(repository, { pushType: PushType.PushTo, pushTo: { remote: remote, refspec: refspec, setUpstream: setUpstream } });
    }
    async pushToForce(repository, remote, refspec, setUpstream) {
        await this._push(repository, { pushType: PushType.PushTo, pushTo: { remote: remote, refspec: refspec, setUpstream: setUpstream }, forcePush: true });
    }
    async pushTags(repository) {
        await this._push(repository, { pushType: PushType.PushTags });
    }
    async addRemote(repository) {
        const url = await (0, remoteSource_1.pickRemoteSource)(this.model, {
            providerLabel: provider => localize('addfrom', "Add remote from {0}", provider.name),
            urlLabel: localize('addFrom', "Add remote from URL")
        });
        if (!url) {
            return;
        }
        const resultName = await vscode_1.window.showInputBox({
            placeHolder: localize('remote name', "Remote name"),
            prompt: localize('provide remote name', "Please provide a remote name"),
            ignoreFocusOut: true,
            validateInput: (name) => {
                if (!sanitizeRemoteName(name)) {
                    return localize('remote name format invalid', "Remote name format invalid");
                }
                else if (repository.remotes.find(r => r.name === name)) {
                    return localize('remote already exists', "Remote '{0}' already exists.", name);
                }
                return null;
            }
        });
        const name = sanitizeRemoteName(resultName || '');
        if (!name) {
            return;
        }
        await repository.addRemote(name, url.trim());
        await repository.fetch({ remote: name });
        return name;
    }
    async removeRemote(repository) {
        const remotes = repository.remotes;
        if (remotes.length === 0) {
            vscode_1.window.showErrorMessage(localize('no remotes added', "Your repository has no remotes."));
            return;
        }
        const picks = remotes.map(r => r.name);
        const placeHolder = localize('remove remote', "Pick a remote to remove");
        const remoteName = await vscode_1.window.showQuickPick(picks, { placeHolder });
        if (!remoteName) {
            return;
        }
        await repository.removeRemote(remoteName);
    }
    async _sync(repository, rebase) {
        const HEAD = repository.HEAD;
        if (!HEAD) {
            return;
        }
        else if (!HEAD.upstream) {
            const branchName = HEAD.name;
            const message = localize('confirm publish branch', "The branch '{0}' has no upstream branch. Would you like to publish this branch?", branchName);
            const yes = localize('ok', "OK");
            const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes);
            if (pick === yes) {
                await this.publish(repository);
            }
            return;
        }
        const remoteName = HEAD.remote || HEAD.upstream.remote;
        const remote = repository.remotes.find(r => r.name === remoteName);
        const isReadonly = remote && remote.isReadOnly;
        const config = vscode_1.workspace.getConfiguration('git');
        const shouldPrompt = !isReadonly && config.get('confirmSync') === true;
        if (shouldPrompt) {
            const message = localize('sync is unpredictable', "This action will push and pull commits to and from '{0}/{1}'.", HEAD.upstream.remote, HEAD.upstream.name);
            const yes = localize('ok', "OK");
            const neverAgain = localize('never again', "OK, Don't Show Again");
            const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, yes, neverAgain);
            if (pick === neverAgain) {
                await config.update('confirmSync', false, true);
            }
            else if (pick !== yes) {
                return;
            }
        }
        if (rebase) {
            await repository.syncRebase(HEAD);
        }
        else {
            await repository.sync(HEAD);
        }
    }
    async sync(repository) {
        try {
            await this._sync(repository, false);
        }
        catch (err) {
            if (/Cancelled/i.test(err && (err.message || err.stderr || ''))) {
                return;
            }
            throw err;
        }
    }
    async syncAll() {
        await Promise.all(this.model.repositories.map(async (repository) => {
            const HEAD = repository.HEAD;
            if (!HEAD || !HEAD.upstream) {
                return;
            }
            await repository.sync(HEAD);
        }));
    }
    async syncRebase(repository) {
        try {
            await this._sync(repository, true);
        }
        catch (err) {
            if (/Cancelled/i.test(err && (err.message || err.stderr || ''))) {
                return;
            }
            throw err;
        }
    }
    async publish(repository) {
        const branchName = repository.HEAD && repository.HEAD.name || '';
        const remotes = repository.remotes;
        if (remotes.length === 0) {
            const providers = this.model.getRemoteProviders().filter(p => !!p.publishRepository);
            if (providers.length === 0) {
                vscode_1.window.showWarningMessage(localize('no remotes to publish', "Your repository has no remotes configured to publish to."));
                return;
            }
            let provider;
            if (providers.length === 1) {
                provider = providers[0];
            }
            else {
                const picks = providers
                    .map(provider => ({ label: (provider.icon ? `$(${provider.icon}) ` : '') + localize('publish to', "Publish to {0}", provider.name), alwaysShow: true, provider }));
                const placeHolder = localize('pick provider', "Pick a provider to publish the branch '{0}' to:", branchName);
                const choice = await vscode_1.window.showQuickPick(picks, { placeHolder });
                if (!choice) {
                    return;
                }
                provider = choice.provider;
            }
            await provider.publishRepository(new api1_1.ApiRepository(repository));
            this.model.firePublishEvent(repository, branchName);
            return;
        }
        if (remotes.length === 1) {
            await repository.pushTo(remotes[0].name, branchName, true);
            this.model.firePublishEvent(repository, branchName);
            return;
        }
        const addRemote = new AddRemoteItem(this);
        const picks = [...repository.remotes.map(r => ({ label: r.name, description: r.pushUrl })), addRemote];
        const placeHolder = localize('pick remote', "Pick a remote to publish the branch '{0}' to:", branchName);
        const choice = await vscode_1.window.showQuickPick(picks, { placeHolder });
        if (!choice) {
            return;
        }
        if (choice === addRemote) {
            const newRemote = await this.addRemote(repository);
            if (newRemote) {
                await repository.pushTo(newRemote, branchName, true);
                this.model.firePublishEvent(repository, branchName);
            }
        }
        else {
            await repository.pushTo(choice.label, branchName, true);
            this.model.firePublishEvent(repository, branchName);
        }
    }
    async ignore(...resourceStates) {
        resourceStates = resourceStates.filter(s => !!s);
        if (resourceStates.length === 0 || (resourceStates[0] && !(resourceStates[0].resourceUri instanceof vscode_1.Uri))) {
            const resource = this.getSCMResource();
            if (!resource) {
                return;
            }
            resourceStates = [resource];
        }
        const resources = resourceStates
            .filter(s => s instanceof repository_1.Resource)
            .map(r => r.resourceUri);
        if (!resources.length) {
            return;
        }
        await this.runByRepository(resources, async (repository, resources) => repository.ignore(resources));
    }
    async revealInExplorer(resourceState) {
        if (!resourceState) {
            return;
        }
        if (!(resourceState.resourceUri instanceof vscode_1.Uri)) {
            return;
        }
        await vscode_1.commands.executeCommand('revealInExplorer', resourceState.resourceUri);
    }
    async _stash(repository, includeUntracked = false) {
        const noUnstagedChanges = repository.workingTreeGroup.resourceStates.length === 0
            && (!includeUntracked || repository.untrackedGroup.resourceStates.length === 0);
        const noStagedChanges = repository.indexGroup.resourceStates.length === 0;
        if (noUnstagedChanges && noStagedChanges) {
            vscode_1.window.showInformationMessage(localize('no changes stash', "There are no changes to stash."));
            return;
        }
        const config = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(repository.root));
        const promptToSaveFilesBeforeStashing = config.get('promptToSaveFilesBeforeStash');
        if (promptToSaveFilesBeforeStashing !== 'never') {
            let documents = vscode_1.workspace.textDocuments
                .filter(d => !d.isUntitled && d.isDirty && (0, util_1.isDescendant)(repository.root, d.uri.fsPath));
            if (promptToSaveFilesBeforeStashing === 'staged' || repository.indexGroup.resourceStates.length > 0) {
                documents = documents
                    .filter(d => repository.indexGroup.resourceStates.some(s => (0, util_1.pathEquals)(s.resourceUri.fsPath, d.uri.fsPath)));
            }
            if (documents.length > 0) {
                const message = documents.length === 1
                    ? localize('unsaved stash files single', "The following file has unsaved changes which won't be included in the stash if you proceed: {0}.\n\nWould you like to save it before stashing?", path.basename(documents[0].uri.fsPath))
                    : localize('unsaved stash files', "There are {0} unsaved files.\n\nWould you like to save them before stashing?", documents.length);
                const saveAndStash = localize('save and stash', "Save All & Stash");
                const stash = localize('stash', "Stash Anyway");
                const pick = await vscode_1.window.showWarningMessage(message, { modal: true }, saveAndStash, stash);
                if (pick === saveAndStash) {
                    await Promise.all(documents.map(d => d.save()));
                }
                else if (pick !== stash) {
                    return;
                }
            }
        }
        let message;
        if (config.get('useCommitInputAsStashMessage') && (!repository.sourceControl.commitTemplate || repository.inputBox.value !== repository.sourceControl.commitTemplate)) {
            message = repository.inputBox.value;
        }
        message = await vscode_1.window.showInputBox({
            value: message,
            prompt: localize('provide stash message', "Optionally provide a stash message"),
            placeHolder: localize('stash message', "Stash message")
        });
        if (typeof message === 'undefined') {
            return;
        }
        await repository.createStash(message, includeUntracked);
    }
    stash(repository) {
        return this._stash(repository);
    }
    stashIncludeUntracked(repository) {
        return this._stash(repository, true);
    }
    async stashPop(repository) {
        const placeHolder = localize('pick stash to pop', "Pick a stash to pop");
        const stash = await this.pickStash(repository, placeHolder);
        if (!stash) {
            return;
        }
        await repository.popStash(stash.index);
    }
    async stashPopLatest(repository) {
        const stashes = await repository.getStashes();
        if (stashes.length === 0) {
            vscode_1.window.showInformationMessage(localize('no stashes', "There are no stashes in the repository."));
            return;
        }
        await repository.popStash();
    }
    async stashApply(repository) {
        const placeHolder = localize('pick stash to apply', "Pick a stash to apply");
        const stash = await this.pickStash(repository, placeHolder);
        if (!stash) {
            return;
        }
        await repository.applyStash(stash.index);
    }
    async stashApplyLatest(repository) {
        const stashes = await repository.getStashes();
        if (stashes.length === 0) {
            vscode_1.window.showInformationMessage(localize('no stashes', "There are no stashes in the repository."));
            return;
        }
        await repository.applyStash();
    }
    async stashDrop(repository) {
        const placeHolder = localize('pick stash to drop', "Pick a stash to drop");
        const stash = await this.pickStash(repository, placeHolder);
        if (!stash) {
            return;
        }
        const yes = localize('yes', "Yes");
        const result = await vscode_1.window.showWarningMessage(localize('sure drop', "Are you sure you want to drop the stash: {0}?", stash.description), yes);
        if (result !== yes) {
            return;
        }
        await repository.dropStash(stash.index);
    }
    async pickStash(repository, placeHolder) {
        const stashes = await repository.getStashes();
        if (stashes.length === 0) {
            vscode_1.window.showInformationMessage(localize('no stashes', "There are no stashes in the repository."));
            return;
        }
        const picks = stashes.map(stash => ({ label: `#${stash.index}:  ${stash.description}`, description: '', details: '', stash }));
        const result = await vscode_1.window.showQuickPick(picks, { placeHolder });
        return result && result.stash;
    }
    async timelineOpenDiff(item, uri, _source) {
        var _a;
        const cmd = this.resolveTimelineOpenDiffCommand(item, uri, {
            preserveFocus: true,
            preview: true,
            viewColumn: vscode_1.ViewColumn.Active
        });
        if (cmd === undefined) {
            return undefined;
        }
        return vscode_1.commands.executeCommand(cmd.command, ...((_a = cmd.arguments) !== null && _a !== void 0 ? _a : []));
    }
    resolveTimelineOpenDiffCommand(item, uri, options) {
        if (uri === undefined || uri === null || !timelineProvider_1.GitTimelineItem.is(item)) {
            return undefined;
        }
        const basename = path.basename(uri.fsPath);
        let title;
        if ((item.previousRef === 'HEAD' || item.previousRef === '~') && item.ref === '') {
            title = localize('git.title.workingTree', '{0} (Working Tree)', basename);
        }
        else if (item.previousRef === 'HEAD' && item.ref === '~') {
            title = localize('git.title.index', '{0} (Index)', basename);
        }
        else {
            title = localize('git.title.diffRefs', '{0} ({1}) ⟷ {0} ({2})', basename, item.shortPreviousRef, item.shortRef);
        }
        return {
            command: 'vscode.diff',
            title: 'Open Comparison',
            arguments: [(0, uri_1.toGitUri)(uri, item.previousRef), item.ref === '' ? uri : (0, uri_1.toGitUri)(uri, item.ref), title, options]
        };
    }
    async timelineCopyCommitId(item, _uri, _source) {
        if (!timelineProvider_1.GitTimelineItem.is(item)) {
            return;
        }
        vscode_1.env.clipboard.writeText(item.ref);
    }
    async timelineCopyCommitMessage(item, _uri, _source) {
        if (!timelineProvider_1.GitTimelineItem.is(item)) {
            return;
        }
        vscode_1.env.clipboard.writeText(item.message);
    }
    async timelineSelectForCompare(item, uri, _source) {
        if (!timelineProvider_1.GitTimelineItem.is(item) || !uri) {
            return;
        }
        this._selectedForCompare = { uri, item };
        await vscode_1.commands.executeCommand('setContext', 'git.timeline.selectedForCompare', true);
    }
    async timelineCompareWithSelected(item, uri, _source) {
        if (!timelineProvider_1.GitTimelineItem.is(item) || !uri || !this._selectedForCompare || uri.toString() !== this._selectedForCompare.uri.toString()) {
            return;
        }
        const { item: selected } = this._selectedForCompare;
        const basename = path.basename(uri.fsPath);
        let leftTitle;
        if ((selected.previousRef === 'HEAD' || selected.previousRef === '~') && selected.ref === '') {
            leftTitle = localize('git.title.workingTree', '{0} (Working Tree)', basename);
        }
        else if (selected.previousRef === 'HEAD' && selected.ref === '~') {
            leftTitle = localize('git.title.index', '{0} (Index)', basename);
        }
        else {
            leftTitle = localize('git.title.ref', '{0} ({1})', basename, selected.shortRef);
        }
        let rightTitle;
        if ((item.previousRef === 'HEAD' || item.previousRef === '~') && item.ref === '') {
            rightTitle = localize('git.title.workingTree', '{0} (Working Tree)', basename);
        }
        else if (item.previousRef === 'HEAD' && item.ref === '~') {
            rightTitle = localize('git.title.index', '{0} (Index)', basename);
        }
        else {
            rightTitle = localize('git.title.ref', '{0} ({1})', basename, item.shortRef);
        }
        const title = localize('git.title.diff', '{0} ⟷ {1}', leftTitle, rightTitle);
        await vscode_1.commands.executeCommand('vscode.diff', selected.ref === '' ? uri : (0, uri_1.toGitUri)(uri, selected.ref), item.ref === '' ? uri : (0, uri_1.toGitUri)(uri, item.ref), title);
    }
    async rebaseAbort(repository) {
        if (repository.rebaseCommit) {
            await repository.rebaseAbort();
        }
        else {
            await vscode_1.window.showInformationMessage(localize('no rebase', "No rebase in progress."));
        }
    }
    createCommand(id, key, method, options) {
        const result = (...args) => {
            let result;
            if (!options.repository) {
                result = Promise.resolve(method.apply(this, args));
            }
            else {
                const repository = this.model.getRepository(args[0]);
                let repositoryPromise;
                if (repository) {
                    repositoryPromise = Promise.resolve(repository);
                }
                else if (this.model.repositories.length === 1) {
                    repositoryPromise = Promise.resolve(this.model.repositories[0]);
                }
                else {
                    repositoryPromise = this.model.pickRepository();
                }
                result = repositoryPromise.then(repository => {
                    if (!repository) {
                        return Promise.resolve();
                    }
                    return Promise.resolve(method.apply(this, [repository, ...args.slice(1)]));
                });
            }
            this.telemetryReporter.sendTelemetryEvent('git.command', { command: id });
            return result.catch(async (err) => {
                const options = {
                    modal: true
                };
                let message;
                let type = 'error';
                const choices = new Map();
                const openOutputChannelChoice = localize('open git log', "Open Git Log");
                const outputChannel = this.outputChannel;
                choices.set(openOutputChannelChoice, () => outputChannel.show());
                const showCommandOutputChoice = localize('show command output', "Show Command Output");
                if (err.stderr) {
                    choices.set(showCommandOutputChoice, async () => {
                        const timestamp = new Date().getTime();
                        const uri = vscode_1.Uri.parse(`git-output:/git-error-${timestamp}`);
                        let command = 'git';
                        if (err.gitArgs) {
                            command = `${command} ${err.gitArgs.join(' ')}`;
                        }
                        else if (err.gitCommand) {
                            command = `${command} ${err.gitCommand}`;
                        }
                        this.commandErrors.set(uri, `> ${command}\n${err.stderr}`);
                        try {
                            const doc = await vscode_1.workspace.openTextDocument(uri);
                            await vscode_1.window.showTextDocument(doc);
                        }
                        finally {
                            this.commandErrors.delete(uri);
                        }
                    });
                }
                switch (err.gitErrorCode) {
                    case "DirtyWorkTree":
                        message = localize('clean repo', "Please clean your repository working tree before checkout.");
                        break;
                    case "PushRejected":
                        message = localize('cant push', "Can't push refs to remote. Try running 'Pull' first to integrate your changes.");
                        break;
                    case "Conflict":
                        message = localize('merge conflicts', "There are merge conflicts. Resolve them before committing.");
                        type = 'warning';
                        options.modal = false;
                        break;
                    case "StashConflict":
                        message = localize('stash merge conflicts', "There were merge conflicts while applying the stash.");
                        type = 'warning';
                        options.modal = false;
                        break;
                    case "AuthenticationFailed":
                        const regex = /Authentication failed for '(.*)'/i;
                        const match = regex.exec(err.stderr || String(err));
                        message = match
                            ? localize('auth failed specific', "Failed to authenticate to git remote:\n\n{0}", match[1])
                            : localize('auth failed', "Failed to authenticate to git remote.");
                        break;
                    case "NoUserNameConfigured":
                    case "NoUserEmailConfigured":
                        message = localize('missing user info', "Make sure you configure your 'user.name' and 'user.email' in git.");
                        choices.set(localize('learn more', "Learn More"), () => vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse('https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup')));
                        break;
                    default:
                        const hint = (err.stderr || err.message || String(err))
                            .replace(/^error: /mi, '')
                            .replace(/^> husky.*$/mi, '')
                            .split(/[\r\n]/)
                            .filter((line) => !!line)[0];
                        message = hint
                            ? localize('git error details', "Git: {0}", hint)
                            : localize('git error', "Git error");
                        break;
                }
                if (!message) {
                    console.error(err);
                    return;
                }
                const allChoices = Array.from(choices.keys());
                const result = type === 'error'
                    ? await vscode_1.window.showErrorMessage(message, options, ...allChoices)
                    : await vscode_1.window.showWarningMessage(message, options, ...allChoices);
                if (result) {
                    const resultFn = choices.get(result);
                    if (resultFn) {
                        resultFn();
                    }
                }
            });
        };
        this[key] = result;
        return result;
    }
    getSCMResource(uri) {
        uri = uri ? uri : (vscode_1.window.activeTextEditor && vscode_1.window.activeTextEditor.document.uri);
        this.outputChannel.appendLine(`git.getSCMResource.uri ${uri && uri.toString()}`);
        for (const r of this.model.repositories.map(r => r.root)) {
            this.outputChannel.appendLine(`repo root ${r}`);
        }
        if (!uri) {
            return undefined;
        }
        if ((0, uri_1.isGitUri)(uri)) {
            const { path } = (0, uri_1.fromGitUri)(uri);
            uri = vscode_1.Uri.file(path);
        }
        if (uri.scheme === 'file') {
            const uriString = uri.toString();
            const repository = this.model.getRepository(uri);
            if (!repository) {
                return undefined;
            }
            return repository.workingTreeGroup.resourceStates.filter(r => r.resourceUri.toString() === uriString)[0]
                || repository.indexGroup.resourceStates.filter(r => r.resourceUri.toString() === uriString)[0];
        }
        return undefined;
    }
    async runByRepository(arg, fn) {
        const resources = arg instanceof vscode_1.Uri ? [arg] : arg;
        const isSingleResource = arg instanceof vscode_1.Uri;
        const groups = resources.reduce((result, resource) => {
            let repository = this.model.getRepository(resource);
            if (!repository) {
                console.warn('Could not find git repository for ', resource);
                return result;
            }
            if ((0, util_1.pathEquals)(resource.fsPath, repository.root)) {
                repository = this.model.getRepositoryForSubmodule(resource) || repository;
            }
            const tuple = result.filter(p => p.repository === repository)[0];
            if (tuple) {
                tuple.resources.push(resource);
            }
            else {
                result.push({ repository, resources: [resource] });
            }
            return result;
        }, []);
        const promises = groups
            .map(({ repository, resources }) => fn(repository, isSingleResource ? resources[0] : resources));
        return Promise.all(promises);
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
__decorate([
    command('git.setLogLevel'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "setLogLevel", null);
__decorate([
    command('git.refresh', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "refresh", null);
__decorate([
    command('git.openResource'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Resource]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "openResource", null);
__decorate([
    command('git.openAllChanges', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "openChanges", null);
__decorate([
    command('git.clone'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "clone", null);
__decorate([
    command('git.cloneRecursive'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "cloneRecursive", null);
__decorate([
    command('git.init'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "init", null);
__decorate([
    command('git.openRepository', { repository: false }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "openRepository", null);
__decorate([
    command('git.close', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "close", null);
__decorate([
    command('git.openFile'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "openFile", null);
__decorate([
    command('git.openFile2'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "openFile2", null);
__decorate([
    command('git.openHEADFile'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "openHEADFile", null);
__decorate([
    command('git.openChange'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "openChange", null);
__decorate([
    command('git.rename', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository, vscode_1.Uri]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "rename", null);
__decorate([
    command('git.stage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stage", null);
__decorate([
    command('git.stageAll', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stageAll", null);
__decorate([
    command('git.stageAllTracked', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stageAllTracked", null);
__decorate([
    command('git.stageAllUntracked', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stageAllUntracked", null);
__decorate([
    command('git.stageAllMerge', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stageAllMerge", null);
__decorate([
    command('git.stageChange'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [vscode_1.Uri, Array, Number]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stageChange", null);
__decorate([
    command('git.stageSelectedRanges', { diff: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stageSelectedChanges", null);
__decorate([
    command('git.revertChange'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [vscode_1.Uri, Array, Number]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "revertChange", null);
__decorate([
    command('git.revertSelectedRanges', { diff: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "revertSelectedRanges", null);
__decorate([
    command('git.unstage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "unstage", null);
__decorate([
    command('git.unstageAll', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "unstageAll", null);
__decorate([
    command('git.unstageSelectedRanges', { diff: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "unstageSelectedRanges", null);
__decorate([
    command('git.clean'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "clean", null);
__decorate([
    command('git.cleanAll', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "cleanAll", null);
__decorate([
    command('git.cleanAllTracked', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "cleanAllTracked", null);
__decorate([
    command('git.cleanAllUntracked', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "cleanAllUntracked", null);
__decorate([
    command('git.commit', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commit", null);
__decorate([
    command('git.commitStaged', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitStaged", null);
__decorate([
    command('git.commitStagedSigned', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitStagedSigned", null);
__decorate([
    command('git.commitStagedAmend', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitStagedAmend", null);
__decorate([
    command('git.commitAll', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitAll", null);
__decorate([
    command('git.commitAllSigned', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitAllSigned", null);
__decorate([
    command('git.commitAllAmend', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitAllAmend", null);
__decorate([
    command('git.commitEmpty', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitEmpty", null);
__decorate([
    command('git.commitNoVerify', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitNoVerify", null);
__decorate([
    command('git.commitStagedNoVerify', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitStagedNoVerify", null);
__decorate([
    command('git.commitStagedSignedNoVerify', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitStagedSignedNoVerify", null);
__decorate([
    command('git.commitStagedAmendNoVerify', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitStagedAmendNoVerify", null);
__decorate([
    command('git.commitAllNoVerify', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitAllNoVerify", null);
__decorate([
    command('git.commitAllSignedNoVerify', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitAllSignedNoVerify", null);
__decorate([
    command('git.commitAllAmendNoVerify', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitAllAmendNoVerify", null);
__decorate([
    command('git.commitEmptyNoVerify', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "commitEmptyNoVerify", null);
__decorate([
    command('git.restoreCommitTemplate', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "restoreCommitTemplate", null);
__decorate([
    command('git.undoCommit', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "undoCommit", null);
__decorate([
    command('git.checkout', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository, String]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "checkout", null);
__decorate([
    command('git.checkoutDetached', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository, String]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "checkoutDetached", null);
__decorate([
    command('git.branch', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "branch", null);
__decorate([
    command('git.branchFrom', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "branchFrom", null);
__decorate([
    command('git.deleteBranch', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository, String, Boolean]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "deleteBranch", null);
__decorate([
    command('git.renameBranch', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "renameBranch", null);
__decorate([
    command('git.merge', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "merge", null);
__decorate([
    command('git.rebase', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "rebase", null);
__decorate([
    command('git.createTag', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "createTag", null);
__decorate([
    command('git.deleteTag', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "deleteTag", null);
__decorate([
    command('git.fetch', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "fetch", null);
__decorate([
    command('git.fetchPrune', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "fetchPrune", null);
__decorate([
    command('git.fetchAll', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "fetchAll", null);
__decorate([
    command('git.pullFrom', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "pullFrom", null);
__decorate([
    command('git.pull', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "pull", null);
__decorate([
    command('git.pullRebase', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "pullRebase", null);
__decorate([
    command('git.push', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "push", null);
__decorate([
    command('git.pushForce', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "pushForce", null);
__decorate([
    command('git.pushWithTags', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "pushFollowTags", null);
__decorate([
    command('git.pushWithTagsForce', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "pushFollowTagsForce", null);
__decorate([
    command('git.cherryPick', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "cherryPick", null);
__decorate([
    command('git.pushTo', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository, String, String, Boolean]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "pushTo", null);
__decorate([
    command('git.pushToForce', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository, String, String, Boolean]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "pushToForce", null);
__decorate([
    command('git.pushTags', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "pushTags", null);
__decorate([
    command('git.addRemote', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "addRemote", null);
__decorate([
    command('git.removeRemote', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "removeRemote", null);
__decorate([
    command('git.sync', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "sync", null);
__decorate([
    command('git._syncAll'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "syncAll", null);
__decorate([
    command('git.syncRebase', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "syncRebase", null);
__decorate([
    command('git.publish', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "publish", null);
__decorate([
    command('git.ignore'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "ignore", null);
__decorate([
    command('git.revealInExplorer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "revealInExplorer", null);
__decorate([
    command('git.stash', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stash", null);
__decorate([
    command('git.stashIncludeUntracked', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stashIncludeUntracked", null);
__decorate([
    command('git.stashPop', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stashPop", null);
__decorate([
    command('git.stashPopLatest', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stashPopLatest", null);
__decorate([
    command('git.stashApply', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stashApply", null);
__decorate([
    command('git.stashApplyLatest', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stashApplyLatest", null);
__decorate([
    command('git.stashDrop', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "stashDrop", null);
__decorate([
    command('git.timeline.openDiff', { repository: false }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof vscode_1.TimelineItem !== "undefined" && vscode_1.TimelineItem) === "function" ? _a : Object, vscode_1.Uri, String]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "timelineOpenDiff", null);
__decorate([
    command('git.timeline.copyCommitId', { repository: false }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof vscode_1.TimelineItem !== "undefined" && vscode_1.TimelineItem) === "function" ? _b : Object, vscode_1.Uri, String]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "timelineCopyCommitId", null);
__decorate([
    command('git.timeline.copyCommitMessage', { repository: false }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof vscode_1.TimelineItem !== "undefined" && vscode_1.TimelineItem) === "function" ? _c : Object, vscode_1.Uri, String]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "timelineCopyCommitMessage", null);
__decorate([
    command('git.timeline.selectForCompare', { repository: false }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof vscode_1.TimelineItem !== "undefined" && vscode_1.TimelineItem) === "function" ? _d : Object, vscode_1.Uri, String]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "timelineSelectForCompare", null);
__decorate([
    command('git.timeline.compareWithSelected', { repository: false }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof vscode_1.TimelineItem !== "undefined" && vscode_1.TimelineItem) === "function" ? _e : Object, vscode_1.Uri, String]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "timelineCompareWithSelected", null);
__decorate([
    command('git.rebaseAbort', { repository: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repository_1.Repository]),
    __metadata("design:returntype", Promise)
], CommandCenter.prototype, "rebaseAbort", null);
exports.CommandCenter = CommandCenter;
//# sourceMappingURL=commands.js.map