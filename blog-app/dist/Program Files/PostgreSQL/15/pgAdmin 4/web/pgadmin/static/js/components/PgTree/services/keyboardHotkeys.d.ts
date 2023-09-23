import { IFileTreeXHandle } from '../types';
export declare class KeyboardHotkeys {
    private readonly fileTreeX;
    private hotkeyActions;
    constructor(fileTreeX: IFileTreeXHandle);
    handleKeyDown: (ev: React.KeyboardEvent) => boolean;
    private jumpToFirstItem;
    private jumpToLastItem;
    private jumpToNextItem;
    private jumpToPrevItem;
    private expandOrJumpToFirstChild;
    private collapseOrJumpToFirstParent;
    private selectFileOrToggleDirState;
    private toggleDirectoryExpand;
    private resetSteppedOrSelectedItem;
    private resetSteppedItem;
}
