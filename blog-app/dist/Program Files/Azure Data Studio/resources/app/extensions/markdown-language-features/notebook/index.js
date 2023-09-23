"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const MarkdownIt = require('markdown-it');
async function activate(ctx) {
    let markdownIt = new MarkdownIt({
        html: true
    });
    await Promise.all(ctx.dependencies.map(async (dep) => {
        try {
            const api = await Promise.resolve().then(() => require(dep.entrypoint));
            if (api === null || api === void 0 ? void 0 : api.extendMarkdownIt) {
                markdownIt = api.extendMarkdownIt(markdownIt);
            }
        }
        catch (e) {
            console.error('Could not load markdown entryPoint', e);
        }
    }));
    return {
        renderMarkup: (context) => {
            const rendered = markdownIt.render(context.content);
            context.element.innerHTML = rendered;
            for (const markdownStyleNode of document.getElementsByClassName('markdown-style')) {
                context.element.appendChild(markdownStyleNode.cloneNode(true));
            }
        }
    };
}
exports.activate = activate;
//# sourceMappingURL=index.js.map