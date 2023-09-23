export declare function activate(ctx: {
    dependencies: ReadonlyArray<{
        entrypoint: string;
    }>;
}): Promise<{
    renderMarkup: (context: {
        element: HTMLElement;
        content: string;
    }) => void;
}>;
