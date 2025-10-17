# LLM Chat Plugin for Obsidian

This plugin for Obsidian allows you to render conversations, such as those with language models, in a chat-like format within your notes.

## Features

- Renders a `conversation` code block into a styled chat interface.
- Differentiates between user messages and responses.
- Easy to use with a simple Markdown syntax.

## How to use

To create a conversation block, use a `conversation` code block and separate each message with `---`.

Example:

````markdown
```conversation

This is the first message, from the user.

---

This is a reply from the assistant.

```
````

Odd-numbered messages (1st, 3rd, 5th, etc.) are treated as user messages, and even-numbered messages are treated as replies.

## Manually installing the plugin

- Git clone this repository to your vault's plugin folder: `[YourVault]/.obsidian/plugins/llm-chat/`.
- Run `npm install` to install the dependencies.
- Run `npm run build` to build the plugin.
- Reload Obsidian and enable the "LLM Chat" plugin in the Community Plugins settings.
