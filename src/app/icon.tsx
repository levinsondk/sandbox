import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";
export const dynamic = "force-dynamic";

const BG_COLORS = [
  { color: "#E1FF00", dark: false },
  { color: "#00DB66", dark: false },
  { color: "#00DFD3", dark: false },
  { color: "#6321FF", dark: true },
  { color: "#F20E9B", dark: true },
  { color: "#FF4D00", dark: true },
];

const BOX_SIZE = 100;
const CENTER = BOX_SIZE / 2;
const MIN_RADIUS_EVEN = 30;
const MAX_RADIUS_EVEN = 50;
const MIN_RADIUS_ODD = 5;
const MAX_RADIUS_ODD = 20;
const MIN_VERTEX_COUNT = 6;
const MAX_VERTEX_COUNT = 12;

function generateConstrainedVertex(
  vertexIndex: number,
  totalVertices: number,
  center: number, // center of the box (e.g., 50 for a 100×100 box)
  minRadius: number, // minimum distance from center
  maxRadius: number // maximum distance from center
): { x: number; y: number } {
  // Calculate the angle slice for this vertex
  const sliceAngle = (2 * Math.PI) / totalVertices;
  const startAngle = sliceAngle * vertexIndex;
  const endAngle = sliceAngle * (vertexIndex + 1);

  // Random angle within the slice
  const angle = startAngle + Math.random() * (endAngle - startAngle);

  // Random radius (use sqrt for uniform area distribution)
  // Without sqrt, points cluster toward center
  const radius = minRadius + Math.sqrt(Math.random()) * (maxRadius - minRadius);

  // Convert polar to cartesian
  const x = center + radius * Math.cos(angle);
  const y = center + radius * Math.sin(angle);

  return { x: Math.round(x), y: Math.round(y) };
}

function getVertexCount() {
  let vertexCount =
    Math.floor(Math.random() * (MAX_VERTEX_COUNT + 1)) + MIN_VERTEX_COUNT;
  if (vertexCount % 2 === 0) {
    return vertexCount;
  } else {
    vertexCount++;
    return vertexCount;
  }
}

function generateRandomSvg() {
  const vertexCount = getVertexCount();
  const bg = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];

  // Generate first vertex
  const firstVertex = generateConstrainedVertex(
    0,
    vertexCount,
    CENTER,
    MIN_RADIUS_EVEN,
    MAX_RADIUS_EVEN
  );
  let pathString = `M ${firstVertex.x} ${firstVertex.y} `;

  // Generate remaining vertices, each in its own pie slice
  for (let i = 1; i < vertexCount; i++) {
    const isEven = i % 2 === 0;
    const vertex = generateConstrainedVertex(
      i,
      vertexCount,
      CENTER,
      isEven ? MIN_RADIUS_EVEN : MIN_RADIUS_ODD,
      isEven ? MAX_RADIUS_EVEN : MAX_RADIUS_ODD
    );
    pathString += `L ${vertex.x} ${vertex.y} `;
  }
  pathString += "Z";

  return {
    bg,
    pathString,
    fill: bg.dark ? "#FFFFFF" : "#262626",
  };
}

function RandomizedSvg({
  data,
}: {
  data: ReturnType<typeof generateRandomSvg>;
}) {
  return (
    <div
      style={{
        background: data.bg.color,
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        overflow: "hidden",
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox={`0 0 ${BOX_SIZE} ${BOX_SIZE}`}
        fill="none"
      >
        <path d={data.pathString} fill={data.fill} />
      </svg>
    </div>
  );
}

// Image generation
export default function Icon() {
  const data = generateRandomSvg();
  return new ImageResponse(
    <RandomizedSvg data={data} />,
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    }
  );
}
