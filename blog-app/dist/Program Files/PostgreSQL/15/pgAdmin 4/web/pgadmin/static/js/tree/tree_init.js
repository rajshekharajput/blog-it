"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_dom_1 = require("react-dom");
const tree_1 = require("./tree");
const react_aspen_1 = require("react-aspen");
const tree_nodes_1 = require("./tree_nodes");
const pgadmin_1 = require("sources/pgadmin");
const PgTree_1 = require("../components/PgTree");
const Theme_1 = require("../Theme");
const Menu_1 = require("../components/Menu");
var initBrowserTree = (pgBrowser) => {
    return new Promise((resolve, reject) => {
        const MOUNT_POINT = '/browser';
        let mtree = new tree_nodes_1.ManageTreeNodes();
        mtree.init(MOUNT_POINT);
        const host = {
            pathStyle: 'unix',
            getItems: async (path) => {
                return mtree.readNode(path);
            },
            sortComparator: (a, b) => {
                if (a._metadata && a._metadata.data._type == 'column')
                    return 0;
                if (a.constructor === b.constructor) {
                    return pgadmin_1.default.natural_sort(a.fileName, b.fileName);
                }
                let retval = 0;
                if (a.constructor === react_aspen_1.Directory) {
                    retval = -1;
                }
                else if (b.constructor === react_aspen_1.Directory) {
                    retval = 1;
                }
                return retval;
            },
        };
        const create = async (parentPath, _data) => {
            try {
                let _node_path = parentPath + "/" + _data.id;
                return mtree.addNode(parentPath, _node_path, _data);
            }
            catch (error) {
                return null;
            }
        };
        const remove = async (path, _removeOnlyChild) => {
            try {
                await mtree.removeNode(path, _removeOnlyChild);
                return true;
            }
            catch (error) {
                return false;
            }
        };
        const update = async (path, data) => {
            try {
                await mtree.updateNode(path, data);
                return true;
            }
            catch (error) {
                return false;
            }
        };
        const treeModelX = new PgTree_1.TreeModelX(host, MOUNT_POINT);
        const itemHandle = function onReady(handler) {
            pgBrowser.tree = new tree_1.Tree(handler, mtree, pgBrowser);
            resolve(pgBrowser);
        };
        treeModelX.root.ensureLoaded().then(() => {
            react_dom_1.default.render(<BrowserTree model={treeModelX} onReady={itemHandle} create={create} remove={remove} update={update}/>, document.getElementById('tree'));
        });
    });
};
function BrowserTree(props) {
    const [contextPos, setContextPos] = React.useState(null);
    const contextMenuItems = pgadmin_1.default.Browser.BrowserContextMenu;
    const getPgMenuItem = (menuItem, i) => {
        if (menuItem.type == 'separator') {
            return <Menu_1.PgMenuDivider key={i}/>;
        }
        if (menuItem.isDisabled) {
            return <React.Fragment key={i}></React.Fragment>;
        }
        const hasCheck = typeof menuItem.checked == 'boolean';
        return <Menu_1.PgMenuItem key={i} disabled={menuItem.isDisabled} onClick={() => {
                menuItem.callback();
            }} hasCheck={hasCheck} checked={menuItem.checked}>{menuItem.label}</Menu_1.PgMenuItem>;
    };
    const onContextMenu = React.useCallback(async (ev, item) => {
        ev.preventDefault();
        if (item) {
            await pgadmin_1.default.Browser.tree.select(item);
            setContextPos({ x: ev.clientX, y: ev.clientY });
        }
    }, []);
    return (<Theme_1.default>
      <PgTree_1.FileTreeX {...props} height={'100%'} disableCache={true} onContextMenu={onContextMenu} onScroll={() => {
            contextPos && setContextPos(null);
        }}/>
      <Menu_1.PgMenu anchorPoint={{
            x: contextPos === null || contextPos === void 0 ? void 0 : contextPos.x,
            y: contextPos === null || contextPos === void 0 ? void 0 : contextPos.y
        }} open={Boolean(contextPos) && contextMenuItems.length != 0} onClose={() => setContextPos(null)} label="context" portal>
        {contextMenuItems.length != 0 && contextMenuItems.map((menuItem, i) => {
            const submenus = menuItem.getMenuItems();
            if (submenus) {
                return <Menu_1.PgSubMenu key={i} label={menuItem.label}>
                {submenus.map((submenuItem, si) => {
                        return getPgMenuItem(submenuItem, i + '-' + si);
                    })}
                </Menu_1.PgSubMenu>;
            }
            return getPgMenuItem(menuItem, i);
        })}
      </Menu_1.PgMenu>
    </Theme_1.default>);
}
module.exports = {
    initBrowserTree: initBrowserTree,
};
//# sourceMappingURL=tree_init.js.map