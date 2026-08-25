"use client";

type Concept = {
  id: string;
  label: string;
  status: "solid" | "gap" | "error";
  relatedTo: string[];
};

type ConceptMapProps = {
  concepts: Concept[];
  onConceptClick?: (id: string) => void;
};

const statusColors: Record<Concept["status"], string> = {
  solid: "bg-green-50 text-green-700",
  gap: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
};

const statusBg: Record<Concept["status"], string> = {
  solid: "bg-green-600",
  gap: "bg-amber-500",
  error: "bg-red-600",
};

export function ConceptMap({ concepts, onConceptClick }: ConceptMapProps) {
  if (concepts.length === 0) return null;

  const nodeRadius = 22;
  const nodeDiameter = nodeRadius * 2;
  const padding = 32;
  const centerY = 85;

  const getNodeX = (index: number, total: number): number => {
    return (
      (nodeDiameter / 2) +
      index * (nodeDiameter + padding) -
      (total * (nodeDiameter + padding) / 2) +
      48
    );
  };

  return (
    <svg
      className="w-full h-64"
      viewBox="0 0 600 120"
      aria-label="Concept map"
    >
      {concepts.map((concept, i) => {
        const total = concepts.length;
        const nodeX = getNodeX(i, total);

        // Draw connection lines to related concepts
        const relatedLines = concept.relatedTo.map((relatedId) => {
          const relatedConcept = concepts.find((c) => c.id === relatedId);
          if (!relatedConcept) return null;

          const relatedIndex = concepts.findIndex((c) => c.id === relatedId);
          const relatedNodeX = getNodeX(relatedIndex, total);

          return (
            <line
              key={`line-${concept.id}-${relatedId}`}
              x1={nodeX + nodeRadius}
              y1={centerY + nodeRadius / 2}
              x2={relatedNodeX + nodeRadius / 2}
              y2={centerY + nodeRadius / 2}
              className="stroke-zinc-300 stroke-1 opacity-60"
            />
          );
        }).filter(Boolean);

        return (
          <g key={concept.id}>
            {/* Connection lines from this concept to related ones */}
            {relatedLines}

            {/* Node circle */}
            <circle
              cx={nodeX + nodeRadius}
              cy={centerY + nodeRadius / 2}
              r={nodeRadius}
              className={`group ${statusBg[concept.status]} opacity-80`}
            />

            {/* Node label - clickable area */}
            <g
              className="group-hover:scale-105 transition-transform"
              onClick={() => onConceptClick && onConceptClick(concept.id)}
            >
              <text
                x={nodeX + nodeRadius}
                y={centerY + nodeRadius + 5}
                textAnchor="middle"
                className={statusColors[concept.status]}
              >
                {concept.label}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}