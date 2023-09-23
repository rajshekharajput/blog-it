"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTreeItem = void 0;
const classnames_1 = require("classnames");
const React = require("react");
const react_aspen_1 = require("react-aspen");
const types_1 = require("../types");
const lodash_1 = require("lodash");
class FileTreeItem extends React.Component {
    constructor(props) {
        super(props);
        this.setActiveFile = async (FileOrDir) => {
            this.props.changeDirectoryCount(FileOrDir.parent);
            if (FileOrDir._loaded !== true) {
                this.events.dispatch(types_1.FileTreeXEvent.onTreeEvents, window.event, 'added', FileOrDir);
            }
            FileOrDir._loaded = true;
        };
        this.handleDivRef = (r) => {
            if (r === null) {
                FileTreeItem.itemIdToRefMap.delete(this.props.item.id);
            }
            else {
                FileTreeItem.itemIdToRefMap.set(this.props.item.id, r);
                FileTreeItem.refToItemIdMap.set(r, this.props.item);
            }
        };
        this.handleContextMenu = (ev) => {
            const { item, itemType, onContextMenu } = this.props;
            if (itemType === react_aspen_1.ItemType.File || itemType === react_aspen_1.ItemType.Directory) {
                onContextMenu(ev, item);
            }
        };
        this.handleClick = (ev) => {
            const { item, itemType, onClick } = this.props;
            if (itemType === react_aspen_1.ItemType.File || itemType === react_aspen_1.ItemType.Directory) {
                onClick(ev, item, itemType);
            }
        };
        this.handleDoubleClick = (ev) => {
            const { item, itemType, onDoubleClick } = this.props;
            if (itemType === react_aspen_1.ItemType.File || itemType === react_aspen_1.ItemType.Directory) {
                onDoubleClick(ev, item, itemType);
            }
        };
        this.handleDragStartItem = (e) => {
            const { item, itemType, events } = this.props;
            if (itemType === react_aspen_1.ItemType.File || itemType === react_aspen_1.ItemType.Directory) {
                const ref = FileTreeItem.itemIdToRefMap.get(item.id);
                if (ref) {
                    events.dispatch(types_1.FileTreeXEvent.onTreeEvents, e, 'dragstart', item);
                }
            }
        };
        this.forceUpdate = this.forceUpdate.bind(this);
    }
    static getBoundingClientRectForItem(item) {
        const divRef = FileTreeItem.itemIdToRefMap.get(item.id);
        if (divRef) {
            return divRef.getBoundingClientRect();
        }
        return null;
    }
    render() {
        const { item, itemType, decorations } = this.props;
        const isRenamePrompt = itemType === react_aspen_1.ItemType.RenamePrompt;
        const isNewPrompt = itemType === react_aspen_1.ItemType.NewDirectoryPrompt || itemType === react_aspen_1.ItemType.NewFilePrompt;
        const isPrompt = isRenamePrompt || isNewPrompt;
        const isDirExpanded = itemType === react_aspen_1.ItemType.Directory
            ? item.expanded
            : itemType === react_aspen_1.ItemType.RenamePrompt && item.target.type === react_aspen_1.FileType.Directory
                ? item.target.expanded
                : false;
        const fileOrDir = (itemType === react_aspen_1.ItemType.File ||
            itemType === react_aspen_1.ItemType.NewFilePrompt ||
            (itemType === react_aspen_1.ItemType.RenamePrompt && item.target.constructor === react_aspen_1.FileEntry))
            ? 'file'
            : 'directory';
        if (this.props.item.parent && this.props.item.parent.path) {
            this.props.item.resolvedPathCache = this.props.item.parent.path + "/" + this.props.item._metadata.data.id;
        }
        const itemChildren = item.children && item.children.length > 0 && item._metadata.data._type.indexOf('coll-') !== -1 ? "(" + item.children.length + ")" : "";
        const is_root = this.props.item.parent.path === '/browser';
        const extraClasses = item._metadata.data.extraClasses ? item._metadata.data.extraClasses.join(' ') : '';
        return (<div className={(0, classnames_1.default)('file-entry', {
                renaming: isRenamePrompt,
                prompt: isRenamePrompt || isNewPrompt,
                new: isNewPrompt,
            }, fileOrDir, decorations ? decorations.classlist : null, `depth-${item.depth}`, extraClasses)} data-depth={item.depth} onContextMenu={this.handleContextMenu} onClick={this.handleClick} onDoubleClick={this.handleDoubleClick} onDragStart={this.handleDragStartItem} ref={this.handleDivRef} draggable={true}>

                {!isNewPrompt && fileOrDir === 'directory' ?
                <i className={(0, classnames_1.default)('directory-toggle', isDirExpanded ? 'open' : '')}/>
                : null}

                <span className='file-label'>
                    {item._metadata && item._metadata.data.icon ?
                <i className={(0, classnames_1.default)('file-icon', item._metadata && item._metadata.data.icon ? item._metadata.data.icon : fileOrDir)}/> : null}
                    <span className='file-name'>
                        {lodash_1.default.unescape(this.props.item.getMetadata('data')._label)}
                        <span className='children-count'>{itemChildren}</span>
                    </span>

                </span>
            </div>);
    }
    componentDidMount() {
        this.events = this.props.events;
        this.props.item.resolvedPathCache = this.props.item.parent.path + "/" + this.props.item._metadata.data.id;
        if (this.props.decorations) {
            this.props.decorations.addChangeListener(this.forceUpdate);
        }
        this.setActiveFile(this.props.item);
    }
    componentWillUnmount() {
        if (this.props.decorations) {
            this.props.decorations.removeChangeListener(this.forceUpdate);
        }
    }
    componentDidUpdate(prevProps) {
        if (prevProps.decorations) {
            prevProps.decorations.removeChangeListener(this.forceUpdate);
        }
        if (this.props.decorations) {
            this.props.decorations.addChangeListener(this.forceUpdate);
        }
    }
}
exports.FileTreeItem = FileTreeItem;
FileTreeItem.renderHeight = 24;
FileTreeItem.itemIdToRefMap = new Map();
FileTreeItem.refToItemIdMap = new Map();
//# sourceMappingURL=index.js.map