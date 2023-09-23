"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardHotkeys = void 0;
const react_aspen_1 = require("react-aspen");
class KeyboardHotkeys {
    constructor(fileTreeX) {
        this.fileTreeX = fileTreeX;
        this.hotkeyActions = {
            'ArrowUp': () => this.jumpToPrevItem(),
            'ArrowDown': () => this.jumpToNextItem(),
            'ArrowRight': () => this.expandOrJumpToFirstChild(),
            'ArrowLeft': () => this.collapseOrJumpToFirstParent(),
            'Space': () => this.toggleDirectoryExpand(),
            'Enter': () => this.selectFileOrToggleDirState(),
            'Home': () => this.jumpToFirstItem(),
            'End': () => this.jumpToLastItem(),
            'Escape': () => this.resetSteppedOrSelectedItem(),
        };
        this.handleKeyDown = (ev) => {
            if (!this.fileTreeX.hasDirectFocus()) {
                return false;
            }
            const { code } = ev.nativeEvent;
            if (code in this.hotkeyActions) {
                ev.preventDefault();
                this.hotkeyActions[code]();
                return true;
            }
        };
        this.jumpToFirstItem = () => {
            const { root } = this.fileTreeX.getModel();
            this.fileTreeX.setActiveFile(root.getFileEntryAtIndex(0), true);
        };
        this.jumpToLastItem = () => {
            const { root } = this.fileTreeX.getModel();
            this.fileTreeX.setActiveFile(root.getFileEntryAtIndex(root.branchSize - 1), true);
        };
        this.jumpToNextItem = () => {
            const { root } = this.fileTreeX.getModel();
            let currentPseudoActive = this.fileTreeX.getActiveFile();
            if (!currentPseudoActive) {
                const selectedFile = this.fileTreeX.getActiveFile();
                if (selectedFile) {
                    currentPseudoActive = selectedFile;
                }
                else {
                    return this.jumpToFirstItem();
                }
            }
            const idx = root.getIndexAtFileEntry(currentPseudoActive);
            if (idx + 1 > root.branchSize) {
                return this.jumpToFirstItem();
            }
            else if (idx > -1) {
                this.fileTreeX.setActiveFile(root.getFileEntryAtIndex(idx + 1), true);
            }
        };
        this.jumpToPrevItem = () => {
            const { root } = this.fileTreeX.getModel();
            let currentPseudoActive = this.fileTreeX.getActiveFile();
            if (!currentPseudoActive) {
                const selectedFile = this.fileTreeX.getActiveFile();
                if (selectedFile) {
                    currentPseudoActive = selectedFile;
                }
                else {
                    return this.jumpToLastItem();
                }
            }
            const idx = root.getIndexAtFileEntry(currentPseudoActive);
            if (idx - 1 < 0) {
                return this.jumpToLastItem();
            }
            else if (idx > -1) {
                this.fileTreeX.setActiveFile(root.getFileEntryAtIndex(idx - 1), true);
            }
        };
        this.selectFileOrToggleDirState = () => {
            const currentPseudoActive = this.fileTreeX.getActiveFile();
            if (!currentPseudoActive) {
                return;
            }
            if (currentPseudoActive.type === react_aspen_1.FileType.Directory) {
                this.fileTreeX.toggleDirectory(currentPseudoActive);
            }
            else if (currentPseudoActive.type === react_aspen_1.FileType.File) {
                this.fileTreeX.setActiveFile(currentPseudoActive, true);
            }
        };
        this.toggleDirectoryExpand = () => {
            const currentPseudoActive = this.fileTreeX.getActiveFile();
            if (!currentPseudoActive) {
                return;
            }
            if (currentPseudoActive.type === react_aspen_1.FileType.Directory) {
                this.fileTreeX.toggleDirectory(currentPseudoActive);
            }
        };
        this.resetSteppedOrSelectedItem = () => {
            const currentPseudoActive = this.fileTreeX.getActiveFile();
            if (currentPseudoActive) {
                return this.resetSteppedItem();
            }
            this.fileTreeX.setActiveFile(null);
        };
        this.resetSteppedItem = () => {
            this.fileTreeX.setActiveFile(null);
        };
    }
    expandOrJumpToFirstChild() {
        const currentPseudoActive = this.fileTreeX.getActiveFile();
        if (currentPseudoActive && currentPseudoActive.type === react_aspen_1.FileType.Directory) {
            if (currentPseudoActive.expanded) {
                return this.jumpToNextItem();
            }
            else {
                this.fileTreeX.openDirectory(currentPseudoActive);
            }
        }
    }
    collapseOrJumpToFirstParent() {
        const currentPseudoActive = this.fileTreeX.getActiveFile();
        if (currentPseudoActive) {
            if (currentPseudoActive.type === react_aspen_1.FileType.Directory && currentPseudoActive.expanded) {
                return this.fileTreeX.closeDirectory(currentPseudoActive);
            }
            this.fileTreeX.setActiveFile(currentPseudoActive.parent, true);
        }
    }
}
exports.KeyboardHotkeys = KeyboardHotkeys;
//# sourceMappingURL=keyboardHotkeys.js.map