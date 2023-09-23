"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTreeX = void 0;
const React = require("react");
const react_aspen_1 = require("react-aspen");
const aspen_decorations_1 = require("aspen-decorations");
const FileTreeItem_1 = require("../FileTreeItem");
const notificar_1 = require("notificar");
const types_1 = require("../types");
const keyboardHotkeys_1 = require("../services/keyboardHotkeys");
const react_virtualized_auto_sizer_1 = require("react-virtualized-auto-sizer");
class FileTreeX extends React.Component {
    constructor(props) {
        super(props);
        this.wrapperRef = React.createRef();
        this.handleTreeEvent = (event) => {
            this.fileTreeEvent = this.props.onEvent;
        };
        this.handleTreeReady = (handle) => {
            var _a, _b;
            const { onReady, model } = this.props;
            const scrollDiv = (_b = (_a = this.wrapperRef.current) === null || _a === void 0 ? void 0 : _a.querySelector('div')) === null || _b === void 0 ? void 0 : _b.querySelector('div');
            if (this.props.onScroll) {
                scrollDiv === null || scrollDiv === void 0 ? void 0 : scrollDiv.addEventListener('scroll', (ev) => { var _a, _b; return (_b = (_a = this.props).onScroll) === null || _b === void 0 ? void 0 : _b.call(_a, ev); });
            }
            this.fileTreeHandle = Object.assign(Object.assign({}, handle), { getModel: () => this.props.model, getActiveFile: () => this.activeFile, setActiveFile: this.setActiveFile, getPseudoActiveFile: () => this.pseudoActiveFile, setPseudoActiveFile: this.setPseudoActiveFile, toggleDirectory: this.toggleDirectory, closeDir: this.closeDir, remove: this.removeDir, newFile: async (dirOrPath) => this.supervisePrompt(await handle.promptNewFile(dirOrPath)), newFolder: async (dirOrPath) => this.supervisePrompt(await handle.promptNewDirectory(dirOrPath)), onBlur: (callback) => this.events.add(types_1.FileTreeXEvent.OnBlur, callback), hasDirectFocus: () => this.wrapperRef.current === document.activeElement, first: this.first, parent: this.parent, hasParent: this.hasParent, isOpen: this.isOpen, isClosed: this.isClosed, itemData: this.itemData, children: this.children, getItemFromDOM: this.getItemFromDOM, getDOMFromItem: this.getDOMFromItem, onTreeEvents: (callback) => this.events.add(types_1.FileTreeXEvent.onTreeEvents, callback), addIcon: this.addIcon, addCssClass: this.addCssClass, create: this.create, remove: this.remove, update: this.update, refresh: this.refresh, setLabel: this.setLabel, unload: this.unload, deSelectActiveFile: this.deSelectActiveFile, resize: this.resize, showLoader: this.showLoader, hideLoader: this.hideLoader });
            model.decorations.addDecoration(this.activeFileDec);
            model.decorations.addDecoration(this.pseudoActiveFileDec);
            this.disposables.add(this.fileTreeHandle.onDidChangeModel((prevModel, newModel) => {
                this.setActiveFile(null);
                this.setPseudoActiveFile(null);
                prevModel.decorations.removeDecoration(this.activeFileDec);
                prevModel.decorations.removeDecoration(this.pseudoActiveFileDec);
                newModel.decorations.addDecoration(this.activeFileDec);
                newModel.decorations.addDecoration(this.pseudoActiveFileDec);
            }));
            this.disposables.add(this.fileTreeHandle.onBlur(() => {
                this.setPseudoActiveFile(null);
            }));
            this.keyboardHotkeys = new keyboardHotkeys_1.KeyboardHotkeys(this.fileTreeHandle);
            if (typeof onReady === 'function') {
                onReady(this.fileTreeHandle);
            }
        };
        this.setActiveFile = async (fileOrDirOrPath, ensureVisible, align) => {
            const fileH = typeof fileOrDirOrPath === 'string'
                ? await this.fileTreeHandle.getFileHandle(fileOrDirOrPath)
                : fileOrDirOrPath;
            if (fileH === this.props.model.root) {
                return;
            }
            if (this.activeFile !== fileH) {
                if (this.activeFile) {
                    this.activeFileDec.removeTarget(this.activeFile);
                }
                if (fileH) {
                    this.activeFileDec.addTarget(fileH, aspen_decorations_1.TargetMatchMode.Self);
                }
                this.activeFile = fileH;
                this.events.dispatch(types_1.FileTreeXEvent.onTreeEvents, window.event, 'selected', fileH);
                if (fileH && ensureVisible === true) {
                    const alignTree = align !== undefined && align !== null ? align : 'auto';
                    await this.fileTreeHandle.ensureVisible(fileH, alignTree);
                }
            }
        };
        this.ensureVisible = async (fileOrDirOrPath) => {
            const fileH = typeof fileOrDirOrPath === 'string'
                ? await this.fileTreeHandle.getFileHandle(fileOrDirOrPath)
                : fileOrDirOrPath;
            if (fileH) {
                await this.fileTreeHandle.ensureVisible(fileH);
            }
        };
        this.deSelectActiveFile = async (fileOrDirOrPath) => {
            const fileH = typeof fileOrDirOrPath === 'string'
                ? await this.fileTreeHandle.getFileHandle(fileOrDirOrPath)
                : fileOrDirOrPath;
            if (fileH === this.props.model.root) {
                return;
            }
            if (this.activeFile === fileH) {
                this.activeFileDec.removeTarget(this.activeFile);
                this.activeFile = null;
            }
        };
        this.setPseudoActiveFile = async (fileOrDirOrPath) => {
            const fileH = typeof fileOrDirOrPath === 'string'
                ? await this.fileTreeHandle.getFileHandle(fileOrDirOrPath)
                : fileOrDirOrPath;
            if (fileH === this.props.model.root) {
                return;
            }
            if (this.pseudoActiveFile !== fileH) {
                if (this.pseudoActiveFile) {
                    this.pseudoActiveFileDec.removeTarget(this.pseudoActiveFile);
                }
                if (fileH) {
                    this.pseudoActiveFileDec.addTarget(fileH, aspen_decorations_1.TargetMatchMode.Self);
                }
                this.pseudoActiveFile = fileH;
            }
            if (fileH) {
                await this.fileTreeHandle.ensureVisible(fileH);
            }
            this.events.dispatch(types_1.FileTreeXEvent.onTreeEvents, window.event, 'selected', fileH);
        };
        this.create = async (parentDir, itemData) => {
            if (parentDir == undefined || parentDir == null) {
                parentDir = this.props.model.root;
            }
            const { create, model } = this.props;
            const isOpen = parentDir.isExpanded;
            let maybeFile = undefined;
            if (isOpen && (parentDir._children == null || parentDir._children.length == 0)) {
                await this.fileTreeHandle.closeDirectory(parentDir);
            }
            if (!parentDir.isExpanded && (parentDir._children == null || parentDir._children.length == 0)) {
                await this.fileTreeHandle.openDirectory(parentDir);
            }
            else {
                await this.fileTreeHandle.openDirectory(parentDir);
                maybeFile = await create(parentDir.path, itemData);
                if (maybeFile && maybeFile.type && maybeFile.name) {
                    model.root.inotify({
                        type: react_aspen_1.WatchEvent.Added,
                        directory: parentDir.path,
                        file: maybeFile,
                    });
                }
            }
            this.changeDirectoryCount(parentDir);
            let newItem = parentDir._children.find((c) => c._metadata.data.id === itemData.id);
            newItem.resolvedPathCache = newItem.parent.path + "/" + newItem._metadata.data.id;
            return newItem;
        };
        this.update = async (item, itemData) => {
            item._metadata.data = itemData;
            await this.props.update(item.path, itemData);
            this.events.dispatch(types_1.FileTreeXEvent.onTreeEvents, window.event, 'updated', item);
        };
        this.refresh = async (item) => {
            const { remove, model } = this.props;
            const isOpen = item.isExpanded;
            if (item.children && item.children.length > 0) {
                for (let entry of item.children) {
                    await this.remove(entry).then(val => { }, error => { console.warn("Error removing item"); });
                }
            }
            if (isOpen) {
                const ref = FileTreeItem_1.FileTreeItem.itemIdToRefMap.get(item.id);
                if (ref) {
                    this.showLoader(ref);
                }
                await this.fileTreeHandle.closeDirectory(item);
                await this.fileTreeHandle.openDirectory(item);
                await this.changeResolvePath(item);
                this.changeDirectoryCount(item);
                if (ref) {
                    this.hideLoader(ref);
                }
            }
        };
        this.unload = async (item) => {
            const { remove, model } = this.props;
            const isOpen = item.isExpanded;
            if (item.children && item.children.length > 0) {
                for (let entry of item.children) {
                    await this.remove(entry).then(val => { }, error => { console.warn(error); });
                }
            }
            if (isOpen) {
                await this.fileTreeHandle.closeDirectory(item);
                this.changeDirectoryCount(item);
            }
        };
        this.remove = async (item) => {
            const { remove, model } = this.props;
            const path = item.path;
            await remove(path, false);
            const dirName = model.root.pathfx.dirname(path);
            const fileName = model.root.pathfx.basename(path);
            const parent = item.parent;
            if (dirName === parent.path) {
                const item_1 = parent._children.find((c) => c._metadata && c._metadata.data.id === fileName);
                if (item_1) {
                    parent.unlinkItem(item_1);
                    if (parent._children.length == 0) {
                        parent._children = null;
                    }
                    this.changeDirectoryCount(parent);
                    this.events.dispatch(types_1.FileTreeXEvent.onTreeEvents, window.event, 'removed', item);
                }
                else {
                    console.warn("Item not found");
                }
            }
        };
        this.first = async (fileOrDirOrPath) => {
            const fileH = typeof fileOrDirOrPath === 'string'
                ? await this.fileTreeHandle.getFileHandle(fileOrDirOrPath)
                : fileOrDirOrPath;
            if (fileH === undefined || fileH === null) {
                return this.props.model.root.children[0];
            }
            if (fileH.branchSize > 0) {
                return fileH.children[0];
            }
            return null;
        };
        this.parent = async (fileOrDirOrPath) => {
            const fileH = typeof fileOrDirOrPath === 'string'
                ? await this.fileTreeHandle.getFileHandle(fileOrDirOrPath)
                : fileOrDirOrPath;
            if (fileH === react_aspen_1.FileType.Directory || fileH === react_aspen_1.FileType.File) {
                return fileH.parent;
            }
            return null;
        };
        this.hasParent = async (fileOrDirOrPath) => {
            const fileH = typeof fileOrDirOrPath === 'string'
                ? await this.fileTreeHandle.getFileHandle(fileOrDirOrPath)
                : fileOrDirOrPath;
            if (fileH === react_aspen_1.FileType.Directory || fileH === react_aspen_1.FileType.File) {
                return fileH.parent ? true : false;
            }
            return false;
        };
        this.children = async (fileOrDirOrPath) => {
            const fileH = typeof fileOrDirOrPath === 'string'
                ? await this.fileTreeHandle.getFileHandle(fileOrDirOrPath)
                : fileOrDirOrPath;
            if (fileH === react_aspen_1.FileType.Directory) {
                return fileH.children;
            }
            return null;
        };
        this.isOpen = async (fileOrDirOrPath) => {
            const fileH = typeof fileOrDirOrPath === 'string'
                ? await this.fileTreeHandle.getFileHandle(fileOrDirOrPath)
                : fileOrDirOrPath;
            if (fileH === react_aspen_1.FileType.Directory) {
                return fileH.isExpanded;
            }
            return false;
        };
        this.isClosed = async (fileOrDirOrPath) => {
            const fileH = typeof fileOrDirOrPath === 'string'
                ? await this.fileTreeHandle.getFileHandle(fileOrDirOrPath)
                : fileOrDirOrPath;
            if (fileH === react_aspen_1.FileType.Directory || fileH === react_aspen_1.FileType.File) {
                return !fileH.isExpanded;
            }
            return false;
        };
        this.itemData = async (fileOrDirOrPath) => {
            const fileH = typeof fileOrDirOrPath === 'string'
                ? await this.fileTreeHandle.getFileHandle(fileOrDirOrPath)
                : fileOrDirOrPath;
            if (fileH === react_aspen_1.FileType.Directory || fileH === react_aspen_1.FileType.File) {
                return fileH._metadata.data;
            }
            return null;
        };
        this.setLabel = async (pathOrDir, label) => {
            const dir = typeof pathOrDir === 'string'
                ? await this.fileTreeHandle.getFileHandle(pathOrDir)
                : pathOrDir;
            const ref = FileTreeItem_1.FileTreeItem.itemIdToRefMap.get(dir.id);
            if (ref) {
                ref.style.background = 'none';
                const label$ = ref.querySelector('span.file-name');
                if (label$) {
                    if (typeof (label) == "object" && label.label) {
                        label = label.label;
                    }
                    label$.innerHTML = label;
                }
            }
        };
        this.changeDirectoryCount = async (pathOrDir) => {
            const dir = typeof pathOrDir === 'string'
                ? await this.fileTreeHandle.getFileHandle(pathOrDir)
                : pathOrDir;
            if (dir.type === react_aspen_1.FileType.Directory && dir._metadata.data && dir._metadata.data.is_collection === true) {
                const ref = FileTreeItem_1.FileTreeItem.itemIdToRefMap.get(dir.id);
                if (ref) {
                    ref.style.background = 'none';
                    const label$ = ref.querySelector('span.children-count');
                    if (dir.children && dir.children.length > 0) {
                        label$.innerHTML = "(" + dir.children.length + ")";
                    }
                    else {
                        label$.innerHTML = "";
                    }
                }
            }
        };
        this.closeDir = async (pathOrDir) => {
            const dir = typeof pathOrDir === 'string'
                ? await this.fileTreeHandle.getFileHandle(pathOrDir)
                : pathOrDir;
            if (dir.type === react_aspen_1.FileType.Directory) {
                if (dir.expanded) {
                    this.fileTreeHandle.closeDirectory(dir);
                    this.events.dispatch(types_1.FileTreeXEvent.onTreeEvents, window.event, 'closed', dir);
                }
            }
        };
        this.toggleDirectory = async (pathOrDir) => {
            const dir = typeof pathOrDir === 'string'
                ? await this.fileTreeHandle.getFileHandle(pathOrDir)
                : pathOrDir;
            if (dir.type === react_aspen_1.FileType.Directory) {
                if (dir.expanded) {
                    this.fileTreeHandle.closeDirectory(dir);
                    this.events.dispatch(types_1.FileTreeXEvent.onTreeEvents, window.event, 'closed', dir);
                }
                else {
                    const ref = FileTreeItem_1.FileTreeItem.itemIdToRefMap.get(dir.id);
                    if (ref) {
                        this.showLoader(ref);
                    }
                    await this.events.dispatch(types_1.FileTreeXEvent.onTreeEvents, window.event, 'beforeopen', dir);
                    await this.fileTreeHandle.openDirectory(dir);
                    await this.changeResolvePath(dir);
                    if (ref) {
                        this.hideLoader(ref);
                    }
                    this.events.dispatch(types_1.FileTreeXEvent.onTreeEvents, window.event, 'opened', dir);
                }
            }
        };
        this.addIcon = async (pathOrDir, icon) => {
            const dir = typeof pathOrDir === 'string'
                ? await this.fileTreeHandle.getFileHandle(pathOrDir)
                : pathOrDir;
            const ref = FileTreeItem_1.FileTreeItem.itemIdToRefMap.get(dir.id);
            if (ref) {
                const label$ = ref.querySelector('.file-label i');
                label$.className = icon.icon;
            }
        };
        this.addCssClass = async (pathOrDir, cssClass) => {
            const dir = typeof pathOrDir === 'string'
                ? await this.fileTreeHandle.getFileHandle(pathOrDir)
                : pathOrDir;
            const ref = FileTreeItem_1.FileTreeItem.itemIdToRefMap.get(dir.id);
            if (ref) {
                ref.classList.add(cssClass);
                if (!dir._metadata.data.extraClasses)
                    dir._metadata.data.extraClasses = [];
                dir._metadata.data.extraClasses.push(cssClass);
            }
        };
        this.showLoader = (ref) => {
            ref.style.background = 'none';
            const label$ = ref.querySelector('i.directory-toggle');
            if (label$)
                label$.classList.add("loading");
        };
        this.hideLoader = (ref) => {
            ref.style.background = 'none';
            const label$ = ref.querySelector('i.directory-toggle');
            if (label$)
                label$.classList.remove("loading");
        };
        this.handleBlur = () => {
            this.events.dispatch(types_1.FileTreeXEvent.OnBlur);
        };
        this.handleItemClicked = async (ev, item, type) => {
            if (type === react_aspen_1.ItemType.Directory && ev.target.className.includes("directory-toggle")) {
                await this.toggleDirectory(item);
            }
            await this.setActiveFile(item);
        };
        this.handleItemDoubleClicked = async (ev, item, type) => {
            await this.toggleDirectory(item);
            await this.setActiveFile(item);
        };
        this.getItemFromDOM = (clientReact) => {
            return FileTreeItem_1.FileTreeItem.refToItemIdMap.get(clientReact);
        };
        this.getDOMFromItem = (item) => {
            return FileTreeItem_1.FileTreeItem.itemIdToRefMap.get(item.id);
        };
        this.handleClick = (ev) => {
            if (ev.currentTarget === ev.target) {
                this.setPseudoActiveFile(null);
            }
        };
        this.handleItemCtxMenu = (ev, item) => {
            var _a, _b;
            return (_b = (_a = this.props).onContextMenu) === null || _b === void 0 ? void 0 : _b.call(_a, ev, item);
        };
        this.handleKeyDown = (ev) => {
            return this.keyboardHotkeys.handleKeyDown(ev);
        };
        this.onResize = (...args) => {
            if (this.wrapperRef.current != null) {
                this.resize();
            }
        };
        this.resize = (scrollX, scrollY) => {
            const scrollXPos = scrollX ? scrollX : 0;
            const scrollYPos = scrollY ? scrollY : this.props.model.state.scrollOffset;
            const div = this.wrapperRef.current.querySelector('div').querySelector('div');
            div.scroll(scrollXPos, scrollYPos);
        };
        this.changeResolvePath = async (item) => {
            if (item.type === react_aspen_1.FileType.File) {
                item.resolvedPathCache = item.parent.path + "/" + item._metadata.data.id;
            }
            if (item.type === react_aspen_1.FileType.Directory && item.children && item.children.length > 0) {
                for (let entry of item.children) {
                    entry.resolvedPathCache = entry.parent.path + "/" + entry._metadata.data.id;
                }
            }
        };
        this.events = new notificar_1.Notificar();
        this.disposables = new notificar_1.DisposablesComposite();
        this.activeFileDec = new aspen_decorations_1.Decoration('active');
        this.pseudoActiveFileDec = new aspen_decorations_1.Decoration('pseudo-active');
    }
    render() {
        const { height, width, model, disableCache } = this.props;
        const { decorations } = model;
        return <div onKeyDown={this.handleKeyDown} className='file-tree' onBlur={this.handleBlur} onClick={this.handleClick} onScroll={this.props.onScroll} ref={this.wrapperRef} style={{
                height: height ? height : "calc(100vh - 60px)",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                flex: 1
            }} tabIndex={-1}>
            <react_virtualized_auto_sizer_1.default onResize={this.onResize}>
            {({ width, height }) => (<react_aspen_1.FileTree height={height} width={width} model={model} itemHeight={FileTreeItem_1.FileTreeItem.renderHeight} onReady={this.handleTreeReady} disableCache={disableCache ? disableCache : false}>
                {(props) => <FileTreeItem_1.FileTreeItem item={props.item} itemType={props.itemType} decorations={decorations.getDecorations(props.item)} onClick={this.handleItemClicked} onDoubleClick={this.handleItemDoubleClicked} onContextMenu={this.handleItemCtxMenu} changeDirectoryCount={this.changeDirectoryCount} events={this.events}/>}
            </react_aspen_1.FileTree>)}
            </react_virtualized_auto_sizer_1.default>
        </div>;
    }
    componentDidMount() {
        for (let child of this.props.model.root.children) {
            this.events.dispatch(types_1.FileTreeXEvent.onTreeEvents, window.event, 'loaded', child);
        }
    }
    componentWillUnmount() {
        const { model } = this.props;
        model.decorations.removeDecoration(this.activeFileDec);
        model.decorations.removeDecoration(this.pseudoActiveFileDec);
        this.disposables.dispose();
    }
}
exports.FileTreeX = FileTreeX;
//# sourceMappingURL=index.js.map