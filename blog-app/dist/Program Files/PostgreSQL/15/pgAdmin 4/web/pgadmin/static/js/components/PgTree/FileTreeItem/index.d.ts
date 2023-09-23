import * as React from 'react';
import { ClasslistComposite } from 'aspen-decorations';
import { Directory, FileEntry, IItemRendererProps, ItemType } from 'react-aspen';
import { FileTreeXEvent } from '../types';
import { Notificar } from 'notificar';
interface IItemRendererXProps {
    decorations: ClasslistComposite;
    onClick: (ev: React.MouseEvent, item: FileEntry | Directory, type: ItemType) => void;
    onContextMenu: (ev: React.MouseEvent, item: FileEntry | Directory) => void;
    events: Notificar<FileTreeXEvent>;
}
export declare class FileTreeItem extends React.Component<IItemRendererXProps & IItemRendererProps> {
    static getBoundingClientRectForItem(item: FileEntry | Directory): ClientRect;
    static readonly renderHeight: number;
    private static readonly itemIdToRefMap;
    private static readonly refToItemIdMap;
    private fileTreeEvent;
    constructor(props: any);
    render(): any;
    componentDidMount(): void;
    private setActiveFile;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: IItemRendererXProps): void;
    private handleDivRef;
    private handleContextMenu;
    private handleClick;
    private handleDoubleClick;
    private handleDragStartItem;
}
export {};
