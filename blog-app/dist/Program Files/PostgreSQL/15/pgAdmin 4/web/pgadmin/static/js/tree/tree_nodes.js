"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCollectionNode = exports.TreeNode = exports.ManageTreeNodes = void 0;
const BrowserFS = require("browserfs");
const url_for_1 = require("sources/url_for");
const pgadmin_1 = require("sources/pgadmin");
const lodash_1 = require("lodash");
const react_aspen_1 = require("react-aspen");
const tree_1 = require("./tree");
const path_fx_1 = require("path-fx");
class ManageTreeNodes {
    constructor(fs) {
        this.init = (_root) => new Promise((res, rej) => {
            let node = { parent: null, children: [], data: null };
            this.tree = {};
            this.tree[_root] = { name: 'root', type: react_aspen_1.FileType.Directory, metadata: node };
            res();
        });
        this.updateNode = (_path, _data) => new Promise((res, rej) => {
            const item = this.findNode(_path);
            if (item) {
                item.name = _data.label;
                item.metadata.data = _data;
            }
            res(true);
        });
        this.removeNode = async (_path, _removeOnlyChild) => {
            const item = this.findNode(_path);
            if (item && item.parentNode) {
                item.children = [];
                item.parentNode.children.splice(item.parentNode.children.indexOf(item), 1);
            }
            return true;
        };
        this.addNode = (_parent, _path, _data) => new Promise((res, rej) => {
            _data.type = _data.inode ? react_aspen_1.FileType.Directory : react_aspen_1.FileType.File;
            _data._label = _data.label;
            _data.label = lodash_1.default.escape(_data.label);
            _data.is_collection = isCollectionNode(_data._type);
            let nodeData = { parent: _parent, children: [], data: _data };
            let tmpParentNode = this.findNode(_parent);
            let treeNode = new TreeNode(_data.id, _data, {}, tmpParentNode, nodeData, _data.type);
            if (tmpParentNode !== null && tmpParentNode !== undefined)
                tmpParentNode.children.push(treeNode);
            res(treeNode);
        });
        this.readNode = (_path) => new Promise((res, rej) => {
            let temp_tree_path = _path, node = this.findNode(_path), base_url = pgadmin_1.default.Browser.URL;
            if (node && node.children.length > 0) {
                if (!node.type === react_aspen_1.FileType.File) {
                    rej("It's a leaf node");
                }
                else {
                    if (node.children.length != 0)
                        res(node.children);
                }
            }
            var self = this;
            async function loadData() {
                let url = '';
                if (_path == '/browser') {
                    url = (0, url_for_1.default)('browser.nodes');
                }
                else {
                    let _parent_url = self.generate_url(_path);
                    if (node.metadata.data._pid == null) {
                        url = node.metadata.data._type + '/children/' + node.metadata.data._id;
                    }
                    else {
                        if (node.metadata.data._type.includes("coll-")) {
                            let _type = node.metadata.data._type.replace("coll-", "");
                            url = _type + '/nodes/' + _parent_url + '/';
                        }
                        else {
                            url = node.metadata.data._type + '/children/' + _parent_url + '/' + node.metadata.data._id;
                        }
                    }
                    url = base_url + url;
                    temp_tree_path = node.path;
                    if (node.metadata.data._type == 'server' && !node.metadata.data.connected) {
                        url = null;
                    }
                }
                async function jsonData(fetch_url) {
                    let result = await fetch(fetch_url, {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-pgA-CSRFToken': pgadmin_1.default.csrf_token
                        },
                    });
                    if (result.status == 200) {
                        try {
                            let json = await result.json();
                            return json.data;
                        }
                        catch (e) {
                            console.warn(e);
                        }
                    }
                    throw new Error("Node Load Error...");
                }
                let treeData = null;
                if (url)
                    treeData = await jsonData(url);
                const Path = BrowserFS.BFSRequire('path');
                const fill = async (tree) => {
                    for (let idx in tree) {
                        const _node = tree[idx];
                        const _pathl = Path.join(_path, _node.id);
                        await self.addNode(temp_tree_path, _pathl, _node);
                    }
                };
                await fill(treeData);
                if (node.children.length > 0)
                    res(node.children);
                else
                    res(null);
            }
            loadData();
        });
        this.generate_url = (path) => {
            let _path = path;
            let _parent_path = [];
            let _partitions = [];
            while (_path != '/') {
                let node = this.findNode(_path);
                let _parent = path_fx_1.unix.dirname(_path);
                if (node.parentNode && node.parentNode.path == _parent) {
                    if (node.parentNode.metadata.data !== null && !node.parentNode.metadata.data._type.includes('coll-'))
                        if (node.parentNode.metadata.data._type.includes('partition')) {
                            _partitions.push(node.parentNode.metadata.data._id);
                        }
                        else {
                            _parent_path.push(node.parentNode.metadata.data._id);
                        }
                }
                _path = _parent;
            }
            _partitions = _partitions.reverse();
            if (_partitions.length > 0)
                _parent_path[0] = _partitions[_partitions.length - 1];
            return _parent_path.reverse().join("/");
        };
        this.tree = {};
        this.tempTree = new TreeNode(undefined, {});
    }
    findNode(path) {
        if (path === null || path === undefined || path.length === 0 || path == '/browser') {
            return this.tempTree;
        }
        return (0, tree_1.findInTree)(this.tempTree, path);
    }
}
exports.ManageTreeNodes = ManageTreeNodes;
class TreeNode {
    constructor(id, data, domNode, parent, metadata, type) {
        this.id = id;
        this.data = data;
        this.setParent(parent);
        this.children = [];
        this.domNode = domNode;
        this.metadata = metadata;
        this.name = metadata ? metadata.data.label : "";
        this.type = type ? type : undefined;
    }
    hasParent() {
        return this.parentNode !== null && this.parentNode !== undefined;
    }
    parent() {
        return this.parentNode;
    }
    setParent(parent) {
        this.parentNode = parent;
        this.path = this.id;
        if (this.id)
            if (parent !== null && parent !== undefined && parent.path !== undefined) {
                this.path = parent.path + '/' + this.id;
            }
            else {
                this.path = '/browser/' + this.id;
            }
    }
    getData() {
        if (this.data === undefined) {
            return undefined;
        }
        else if (this.data === null) {
            return null;
        }
        return Object.assign({}, this.data);
    }
    getHtmlIdentifier() {
        return this.domNode;
    }
    ancestorNode(condition) {
        let node = this;
        while (node.hasParent()) {
            node = node.parent();
            if (condition(node)) {
                return node;
            }
        }
        return null;
    }
    anyFamilyMember(condition) {
        if (condition(this)) {
            return true;
        }
        return this.ancestorNode(condition) !== null;
    }
    anyParent(condition) {
        return this.ancestorNode(condition) !== null;
    }
    reload(tree) {
        return new Promise((resolve) => {
            this.unload(tree)
                .then(() => {
                tree.setInode(this.domNode);
                tree.deselect(this.domNode);
                setTimeout(() => {
                    tree.selectNode(this.domNode);
                }, 0);
                resolve();
            });
        });
    }
    unload(tree) {
        return new Promise((resolve, reject) => {
            this.children = [];
            tree.unload(this.domNode)
                .then(() => {
                resolve(true);
            }, () => {
                reject();
            });
        });
    }
    open(tree, suppressNoDom) {
        return new Promise((resolve, reject) => {
            if (suppressNoDom && (this.domNode == null || typeof (this.domNode) === 'undefined')) {
                resolve(true);
            }
            else if (tree.isOpen(this.domNode)) {
                resolve(true);
            }
            else {
                tree.open(this.domNode).then(val => resolve(true), err => reject(true));
            }
        });
    }
}
exports.TreeNode = TreeNode;
function isCollectionNode(node) {
    if (pgadmin_1.default.Browser.Nodes && node in pgadmin_1.default.Browser.Nodes) {
        if (pgadmin_1.default.Browser.Nodes[node].is_collection !== undefined)
            return pgadmin_1.default.Browser.Nodes[node].is_collection;
        else
            return false;
    }
    return false;
}
exports.isCollectionNode = isCollectionNode;
//# sourceMappingURL=tree_nodes.js.map