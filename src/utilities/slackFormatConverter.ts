import { prettyPrint } from './prettyPrint';

/**
 * Convert Quill HTML to Slack mrkdwn syntax
 * Reference: https://api.slack.com/reference/surfaces/formatting
 *
 * IMPORTANT: Slack mrkdwn does NOT support:
 * - Text colors (color/font-color styling will be ignored)
 * - Background colors (background-color styling will be ignored)
 * - Font sizes or families
 *
 * Supported formatting:
 * - Bold (*text*)
 * - Italic (_text_)
 * - Strikethrough (~text~)
 * - Code (`code` or ```code```)
 * - Links
 */
export function htmlToSlackMrkdwn(html: string): string {
  let text = html;

  // Remove Quill wrapper divs
  text = text.replace(/<div class="ql-editor[^"]*"[^>]*>/gi, '');

  // Remove color/font styling (Slack doesn't support it)
  // Strip out style attributes containing color, font-size, font-family, etc.
  text = text.replace(/\s+style="[^"]*"/gi, '');

  // Convert bold: <strong> or <b> to *text*
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '*$1*');
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '*$1*');

  // Convert italic: <em> or <i> to _text_
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_');
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_');

  // Convert strikethrough: <s> or <strike> to ~text~
  text = text.replace(/<s[^>]*>(.*?)<\/s>/gi, '~$1~');
  text = text.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~$1~');

  // Convert code blocks: <pre><code> to ```text```
  text = text.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```$1```');

  // Convert inline code: <code> to `text`
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Convert links: <a href="url">text</a> to <url|text>
  text = text.replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '<$1|$2>');

  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Convert paragraphs
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<p[^>]*>/gi, '');

  // Convert lists
  text = text.replace(/<ul[^>]*>/gi, '');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '');
  text = text.replace(/<\/ol>/gi, '\n');
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Clean up multiple newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  prettyPrint('[htmlToSlackMrkdwn] Converted:', { html, mrkdwn: text }, 'cyan');

  return text;
}

/**
 * Convert Slack rich text blocks to HTML for display
 * This is the PRIMARY method for rendering messages
 * Reference: https://api.slack.com/reference/block-kit/blocks#rich_text
 */
export function slackBlocksToHtml(blocks: any[]): string {
  if (!blocks || blocks.length === 0) {
    return '';
  }

  const htmlParts: string[] = [];

  for (const block of blocks) {
    if (block.type === 'rich_text') {
      for (const element of block.elements || []) {
        if (element.type === 'rich_text_section') {
          htmlParts.push(convertRichTextSection(element.elements || []));
        } else if (element.type === 'rich_text_list') {
          htmlParts.push(convertRichTextList(element));
        } else if (element.type === 'rich_text_quote') {
          htmlParts.push(convertRichTextQuote(element.elements || []));
        } else if (element.type === 'rich_text_preformatted') {
          htmlParts.push(convertRichTextPreformatted(element.elements || []));
        }
      }
    }
  }

  return htmlParts.join('');
}

/**
 * Convert a rich_text_section to HTML
 */
function convertRichTextSection(elements: any[]): string {
  const parts: string[] = [];

  for (const el of elements) {
    let text = '';

    if (el.type === 'text') {
      text = escapeHtml(el.text || '');

      // Apply styles
      if (el.style) {
        if (el.style.bold) text = `<strong>${text}</strong>`;
        if (el.style.italic) text = `<em>${text}</em>`;
        if (el.style.strike) text = `<s>${text}</s>`;
        if (el.style.code) text = `<code>${text}</code>`;
      }
    } else if (el.type === 'link') {
      const url = escapeHtml(el.url || '');
      const linkText = escapeHtml(el.text || el.url || '');
      text = `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    } else if (el.type === 'emoji') {
      // Use unicode if available, otherwise show :emoji_name:
      text = el.unicode || `:${el.name}:`;
    } else if (el.type === 'channel') {
      text = `<span class="slack-channel">#${escapeHtml(el.channel_id || '')}</span>`;
    } else if (el.type === 'user') {
      text = `<span class="slack-user">@${escapeHtml(el.user_id || '')}</span>`;
    }

    parts.push(text);
  }

  return parts.join('') + '<br>';
}

/**
 * Convert a rich_text_list to HTML
 */
function convertRichTextList(listElement: any): string {
  const tag = listElement.style === 'ordered' ? 'ol' : 'ul';
  const items = (listElement.elements || []).map((item: any) => {
    const content = convertRichTextSection(item.elements || []);
    return `<li>${content}</li>`;
  });
  return `<${tag}>${items.join('')}</${tag}>`;
}

/**
 * Convert a rich_text_quote to HTML
 */
function convertRichTextQuote(elements: any[]): string {
  const content = convertRichTextSection(elements);
  return `<blockquote>${content}</blockquote>`;
}

/**
 * Convert a rich_text_preformatted to HTML
 */
function convertRichTextPreformatted(elements: any[]): string {
  const text = elements.map(el => escapeHtml(el.text || '')).join('');
  return `<pre><code>${text}</code></pre>`;
}

/**
 * Fallback: Convert Slack mrkdwn text to HTML
 * Used when blocks are not available
 */
export function slackMrkdwnToHtml(mrkdwn: string): string {
  if (!mrkdwn) return '';

  let html = mrkdwn;

  // Handle code blocks first
  const codeBlocks: string[] = [];
  html = html.replace(/```([\s\S]*?)```/g, (_match, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
    return placeholder;
  });

  // Handle inline code
  const inlineCodes: string[] = [];
  html = html.replace(/`([^`]+)`/g, (_match, code) => {
    const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  // Escape HTML
  html = escapeHtml(html);

  // Convert Slack link format: <url|text>
  html = html.replace(/&lt;([^|>]+)\|([^>]+)&gt;/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>');

  // Convert bare URLs: <url>
  html = html.replace(/&lt;(https?:\/\/[^>]+)&gt;/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  // Convert bold: *text*
  html = html.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');

  // Convert italic: _text_
  html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');

  // Convert strikethrough: ~text~
  html = html.replace(/~([^~\n]+)~/g, '<s>$1</s>');

  // Convert line breaks
  html = html.replace(/\n/g, '<br>');

  // Restore code blocks and inline code
  codeBlocks.forEach((code, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, code);
  });
  inlineCodes.forEach((code, index) => {
    html = html.replace(`__INLINE_CODE_${index}__`, code);
  });

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
