import type { CSSProperties } from "react";
import { CitationList, CitationSource } from "../../atoms/InlineCitation/InlineCitation";
import type { Block } from "../../organisms/ChatPanel/chat-types";
import { ArtifactPanel } from "../ArtifactPanel/ArtifactPanel";
import { CodeBlock } from "../CodeBlock/CodeBlock";
import { ReasoningBlock } from "../ReasoningBlock/ReasoningBlock";
import { TextBlock } from "../TextBlock/TextBlock";
import { ToolCallBlock } from "../ToolCallBlock/ToolCallBlock";

export interface BlockRendererProps {
  block: Block;
  onArtifactOpen?: (id: string) => void;
  style?: CSSProperties;
}

/**
 * The single dispatch point for a `Block`. Delegates each block type to its
 * dedicated molecule. Unknown types render a dim placeholder — never throws.
 */
export function BlockRenderer({ block, onArtifactOpen, style }: BlockRendererProps) {
  const styleProp = style ? { style } : {};
  const openProp = onArtifactOpen ? { onOpen: onArtifactOpen } : {};
  switch (block.type) {
    case "text":
      return (
        <TextBlock
          text={block.text}
          {...(block.streaming ? { streaming: block.streaming } : {})}
          {...styleProp}
        />
      );
    case "reasoning":
      return (
        <ReasoningBlock
          text={block.text}
          {...(block.defaultCollapsed ? { defaultCollapsed: block.defaultCollapsed } : {})}
          {...styleProp}
        />
      );
    case "tool_call":
      return <ToolCallBlock block={block} {...styleProp} />;
    case "code":
      return <CodeBlock {...(block.language ? { lang: block.language } : {})}>{block.code}</CodeBlock>;
    case "artifact":
      return <ArtifactPanel block={block} {...openProp} {...styleProp} />;
    case "citations":
      return (
        <CitationList>
          {block.sources.map((s, i) => (
            <CitationSource key={i} label={s.label} {...(s.accent ? { accent: s.accent } : {})}>
              {s.children}
            </CitationSource>
          ))}
        </CitationList>
      );
    default:
      return (
        <div style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 12, ...style }}>
          unknown block: {(block as { type: string }).type}
        </div>
      );
  }
}
