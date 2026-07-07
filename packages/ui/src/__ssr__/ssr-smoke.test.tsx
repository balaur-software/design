import { describe, expect, it } from "bun:test";
import { renderToReadableStream } from "react-dom/server";
import { FillButton } from "../atoms/FillButton/FillButton";
import { TextInput } from "../molecules/TextInput/TextInput";
import { ChatPanel } from "../organisms/ChatPanel/ChatPanel";
import type { Block, ChatMessageData } from "../organisms/ChatPanel/chat-types";
import { Table, type TableColumn } from "../organisms/Table/Table";
import { Tabs } from "../organisms/Tabs/Tabs";

/**
 * Asserts that rendering `node` to a stream on the server (no DOM) does not
 * throw, produces a non-empty string, and contains `needle`. Exercises the
 * real SSR path `web/` uses (`renderToReadableStream`), so any render-time
 * access to `window`/`document`/portal would blow up here.
 */
async function expectStreamContains(node: React.ReactNode, needle: string): Promise<void> {
  const stream = await renderToReadableStream(node);
  const html = await Bun.readableStreamToText(stream);
  expect(html.length).toBeGreaterThan(0);
  expect(html).toContain(needle);
}

describe("SSR smoke", () => {
  it("renders FillButton to a stream", async () => {
    await expectStreamContains(<FillButton>ENGAGE</FillButton>, "ENGAGE");
  });

  it("renders TextInput to a stream", async () => {
    await expectStreamContains(<TextInput defaultValue="relay-07" />, "relay-07");
  });

  it("renders Tabs to a stream with tablist semantics", async () => {
    await expectStreamContains(<Tabs tabs={[{ label: "ALPHA", panel: "alpha body" }]} />, "ALPHA");
  });

  it("renders Table to a stream", async () => {
    interface Row {
      node: string;
      load: number;
    }
    const columns: TableColumn<Row>[] = [
      { key: "node", label: "NODE" },
      { key: "load", label: "LOAD" },
    ];
    await expectStreamContains(
      <Table columns={columns} rows={[{ node: "OCTANT-01", load: 0.8 }]} />,
      "OCTANT-01",
    );
  });

  it("renders ChatPanel (atoms + molecules + organisms) to a stream", async () => {
    const blocks: Block[] = [{ type: "text", text: "hello from the agent" }];
    const messages: ChatMessageData[] = [
      { id: "m1", role: "agent", blocks, status: "complete" },
      { id: "m2", role: "user", blocks: [{ type: "text", text: "hi there" }] },
    ];
    await expectStreamContains(<ChatPanel messages={messages} onSend={() => {}} />, "hello from the agent");
  });
});
