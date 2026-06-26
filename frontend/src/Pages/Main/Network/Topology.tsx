import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import ReactFlow, { Background, Controls, Edge, Node } from "reactflow";
import "reactflow/dist/style.css";
import CardHeader from "../../../Components/Headers/CardHeader";
import { faNetworkWired } from "@fortawesome/free-solid-svg-icons";
import { getTopology, TopologyNode } from "../../../Services/networkConnections";

const COLUMN_ORDER = ["Switch", "Router", "Firewall", "AP", "Deskphone", "Endpoint"];

const nodeLabel = (n: TopologyNode) => {
  const name = n.assetName || `${n.manufacturer ?? ""} ${n.model ?? ""}`.trim();
  const ip = n.managementIp ? `\n${n.managementIp}` : "";
  return `${name || n.id}${ip}`;
};

const columnFor = (n: TopologyNode) => (n.group === "Network" ? n.subgroup ?? "Other" : "Endpoint");

const Topology = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const topologyQuery = useQuery({ queryKey: ["network-topology"], queryFn: getTopology });

  const { nodes, edges } = useMemo(() => {
    const data = topologyQuery.data;
    if (!data) return { nodes: [] as Node[], edges: [] as Edge[] };

    const columns = new Map<string, TopologyNode[]>();
    for (const n of data.nodes) {
      const col = columnFor(n);
      if (!columns.has(col)) columns.set(col, []);
      columns.get(col)!.push(n);
    }

    const orderedColumns = [
      ...COLUMN_ORDER.filter((c) => columns.has(c)),
      ...Array.from(columns.keys()).filter((c) => !COLUMN_ORDER.includes(c)),
    ];

    const flowNodes: Node[] = [];
    orderedColumns.forEach((col, colIndex) => {
      const items = columns.get(col) ?? [];
      items.forEach((n, rowIndex) => {
        flowNodes.push({
          id: n.id,
          position: { x: colIndex * 260, y: rowIndex * 110 },
          data: { label: nodeLabel(n) },
          style: {
            whiteSpace: "pre-line",
            borderRadius: 10,
            border: "1px solid #535353",
            padding: 8,
            fontWeight: 700,
            fontSize: 12,
            background: col === "Endpoint" ? "#F0F0F0" : "#E8F4FD",
          },
        });
      });
    });

    const flowEdges: Edge[] = data.edges.map((c) => ({
      id: c.id,
      source: c.sourceDeviceId,
      target: c.targetDeviceId,
      label: [c.sourcePort, c.targetPort].filter(Boolean).join(" → ") || c.linkType,
      animated: false,
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [topologyQuery.data]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4">
        <CardHeader text={t("nav.topology")} icon={faNetworkWired} />
        <p className="text-[13px] text-[#9a9a9a] mt-1">{t("network.topology.hint")}</p>
      </div>
      <div className="flex-1 min-h-[600px] bg-white">
        {nodes.length === 0 ? (
          <div className="p-6 text-[14px] text-[#9a9a9a]">{t("network.topology.empty")}</div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={(_e, node) => navigate(`/admin/devices/${node.id}/overview`)}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        )}
      </div>
    </div>
  );
};

export default Topology;
