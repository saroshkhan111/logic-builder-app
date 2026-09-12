import { DEFAULT_PYTHON_CODE, useLogicFlowStore } from "@/store/logicFlowStore";

const node = (id: string) => ({
  id,
  type: "default" as const,
  position: { x: 0, y: 0 },
  data: { label: id },
});

describe("useLogicFlowStore", () => {
  beforeEach(() => {
    useLogicFlowStore.getState().reset();
  });

  it("starts empty", () => {
    const { nodes, edges } = useLogicFlowStore.getState();
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });

  it("uses DEFAULT_PYTHON_CODE for the editor stub", () => {
    expect(useLogicFlowStore.getState().pythonCode).toBe(DEFAULT_PYTHON_CODE);
    useLogicFlowStore.getState().setPythonCode("print(1)");
    useLogicFlowStore.getState().reset();
    expect(useLogicFlowStore.getState().pythonCode).toBe(DEFAULT_PYTHON_CODE);
  });

  it("addNode appends and de-duplicates by id", () => {
    const store = useLogicFlowStore.getState();
    store.addNode(node("n1"));
    store.addNode(node("n1"));
    store.addNode(node("n2"));
    expect(useLogicFlowStore.getState().nodes.map((n) => n.id)).toEqual([
      "n1",
      "n2",
    ]);
  });

  it("addEdge appends and de-duplicates by id", () => {
    const store = useLogicFlowStore.getState();
    store.addEdge({ id: "e1", source: "n1", target: "n2" });
    store.addEdge({ id: "e1", source: "n1", target: "n2" });
    expect(useLogicFlowStore.getState().edges).toHaveLength(1);
  });

  it("onNodesChange applies positional updates by id", () => {
    const store = useLogicFlowStore.getState();
    store.addNode(node("n1"));
    store.onNodesChange([{ id: "n1", position: { x: 5, y: 5 } }]);
    expect(useLogicFlowStore.getState().nodes[0].position).toEqual({
      x: 5,
      y: 5,
    });
  });

  it("reset clears everything", () => {
    const store = useLogicFlowStore.getState();
    store.addNode(node("n1"));
    store.setActiveNode("n1");
    store.reset();
    const state = useLogicFlowStore.getState();
    expect(state.nodes).toEqual([]);
    expect(state.activeNodeId).toBeNull();
  });
});
