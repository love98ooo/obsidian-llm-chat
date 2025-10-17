import { App, Plugin, MarkdownRenderer, MarkdownPostProcessorContext } from 'obsidian';

export default class MyPlugin extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor('conversation', (source, el, ctx) => {
			const messages = source.split('---').map(s => s.trim()).filter(Boolean);

			const container = el.createDiv({ cls: 'conversation' });

			for (const msg of messages) {
				const msgEl = container.createDiv({ cls: 'msg' });
				MarkdownRenderer.render(this.app, msg, msgEl, ctx.sourcePath, this);
			}
		});
	}

	onunload() {

	}
}
