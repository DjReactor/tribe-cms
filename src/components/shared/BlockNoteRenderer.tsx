import type { CSSProperties, ReactNode } from 'react';

/**
 * Renders saved BlockNote content as plain semantic HTML, on the server.
 *
 * This used to mount a read-only `BlockNoteView`, which is a client editor: it
 * touches `window` while the editor is constructed, so every server-rendered
 * page carrying rich text threw `ReferenceError: window is not defined` and
 * returned a 500 — service pages, area pages, blog posts, catalog detail pages
 * and landing pages alike. The public site is `force-dynamic`, so there was no
 * cached HTML hiding it.
 *
 * Dynamically importing the editor with `ssr: false` would have stopped the
 * crash and been the wrong fix: the body of a landing page or a blog post IS
 * the page: content that only exists after hydration is content Google has no
 * reason to rank. So the blocks are walked here and emitted as markup instead,
 * which also keeps the editor and its Mantine styles out of the public bundle.
 * The dashboard editor (`components/dashboard/BlockNoteEditor`) is untouched
 * and still owns its own CSS imports.
 *
 * Unknown block types degrade rather than disappear: their inline content and
 * children are still rendered, so a block type added to the editor later shows
 * its text here before anybody teaches this file about it.
 */

interface BlockNoteRendererProps {
  content: unknown[];
  className?: string;
}

type Styles = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  textColor?: string;
  backgroundColor?: string;
};

type InlineNode = {
  type?: string;
  text?: string;
  href?: string;
  styles?: Styles;
  content?: unknown;
};

type Block = {
  id?: string;
  type?: string;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: unknown;
};

/** Colour names BlockNote writes; `default` means "inherit". */
const colorVar = (value: string | undefined, property: 'color' | 'backgroundColor'): CSSProperties | undefined =>
  !value || value === 'default' ? undefined : { [property]: value } as CSSProperties;

function renderInline(nodes: unknown, keyPrefix: string): ReactNode {
  if (typeof nodes === 'string') return nodes;
  if (!Array.isArray(nodes)) return null;

  return nodes.map((raw, i) => {
    const node = raw as InlineNode;
    const key = `${keyPrefix}-${i}`;

    if (node?.type === 'link') {
      return (
        <a key={key} href={node.href || '#'}>
          {renderInline(node.content, key)}
        </a>
      );
    }

    const text = typeof node?.text === 'string' ? node.text : '';
    if (!text) return null;

    const styles = node.styles || {};
    const style: CSSProperties = {
      ...colorVar(styles.textColor, 'color'),
      ...colorVar(styles.backgroundColor, 'backgroundColor'),
    };

    let element: ReactNode = text;
    if (styles.code) element = <code>{element}</code>;
    if (styles.bold) element = <strong>{element}</strong>;
    if (styles.italic) element = <em>{element}</em>;
    if (styles.underline) element = <u>{element}</u>;
    if (styles.strike) element = <s>{element}</s>;

    return Object.keys(style).length > 0
      ? <span key={key} style={style}>{element}</span>
      : <span key={key}>{element}</span>;
  });
}

function renderTable(block: Block, key: string): ReactNode {
  const rows = (block.content as { rows?: { cells?: unknown[] }[] } | undefined)?.rows;
  if (!Array.isArray(rows)) return null;

  return (
    <table key={key}>
      <tbody>
        {rows.map((row, r) => (
          <tr key={`${key}-r${r}`}>
            {(row.cells || []).map((cell, c) => (
              <td key={`${key}-r${r}-c${c}`}>
                {renderInline(
                  // A cell is either inline content directly or `{ content: [...] }`.
                  Array.isArray(cell) ? cell : (cell as { content?: unknown })?.content,
                  `${key}-r${r}-c${c}`,
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderBlock(block: Block, key: string): ReactNode {
  const props = block.props || {};
  const inline = renderInline(block.content, key);
  const children = renderBlocks(block.children, `${key}-c`);

  switch (block.type) {
    case 'heading': {
      const level = Number(props.level) || 1;
      const Tag = (level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4') as 'h2' | 'h3' | 'h4';
      // Deliberately shifted down one: the page's own H1 is the template's, and
      // body copy must never introduce a second one.
      return <Tag key={key}>{inline}{children}</Tag>;
    }
    case 'quote':
      return <blockquote key={key}>{inline}{children}</blockquote>;
    case 'codeBlock':
      return (
        <pre key={key}>
          <code>{typeof block.content === 'string' ? block.content : inline}</code>
        </pre>
      );
    case 'image':
      return props.url ? (
        <figure key={key}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={String(props.url)}
            alt={String(props.name || props.caption || '')}
            style={props.previewWidth ? { width: `${props.previewWidth}px`, maxWidth: '100%' } : undefined}
          />
          {props.caption ? <figcaption>{String(props.caption)}</figcaption> : null}
        </figure>
      ) : null;
    case 'video':
      return props.url ? <video key={key} src={String(props.url)} controls /> : null;
    case 'audio':
      return props.url ? <audio key={key} src={String(props.url)} controls /> : null;
    case 'file':
      return props.url ? (
        <p key={key}>
          <a href={String(props.url)}>{String(props.name || props.url)}</a>
        </p>
      ) : null;
    case 'table':
      return renderTable(block, key);
    case 'pageBreak':
      return <hr key={key} />;
    default:
      // paragraph and anything this file has not been taught yet.
      return <p key={key}>{inline}{children}</p>;
  }
}

const LIST_TAG: Record<string, 'ul' | 'ol'> = {
  bulletListItem: 'ul',
  numberedListItem: 'ol',
  checkListItem: 'ul',
};

/**
 * Blocks in order, with consecutive list items gathered into one `<ul>`/`<ol>`.
 *
 * BlockNote stores list items as siblings, not as a list container, so grouping
 * has to happen here or every bullet becomes its own single-item list.
 */
function renderBlocks(blocks: unknown, keyPrefix: string): ReactNode {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  const out: ReactNode[] = [];
  let run: { tag: 'ul' | 'ol'; type: string; items: ReactNode[] } | null = null;

  const flush = () => {
    if (!run) return;
    const Tag = run.tag;
    out.push(<Tag key={`${keyPrefix}-list-${out.length}`}>{run.items}</Tag>);
    run = null;
  };

  blocks.forEach((raw, i) => {
    const block = raw as Block;
    const key = `${keyPrefix}-${block.id || i}`;
    const tag = block.type ? LIST_TAG[block.type] : undefined;

    if (tag) {
      if (!run || run.type !== block.type) {
        flush();
        run = { tag, type: block.type!, items: [] };
      }
      run.items.push(
        <li key={key}>
          {block.type === 'checkListItem' && (
            <input type="checkbox" checked={Boolean(block.props?.checked)} readOnly />
          )}
          {renderInline(block.content, key)}
          {renderBlocks(block.children, `${key}-c`)}
        </li>,
      );
      return;
    }

    flush();
    out.push(renderBlock(block, key));
  });

  flush();
  return out;
}

export function BlockNoteRenderer({ content, className = '' }: BlockNoteRendererProps) {
  if (!Array.isArray(content) || content.length === 0) return null;

  return (
    <div className={`prose max-w-none ${className}`}>
      {renderBlocks(content, 'bn')}
    </div>
  );
}
