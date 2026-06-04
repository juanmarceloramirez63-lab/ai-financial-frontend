import type { NextConfig } from "next";

const nextConfig: NextConfig = {
typescript: {
    // !! ADVERTENCIA !!
    // Esto permite que los despliegues en producción completen con éxito
    // incluso si tu proyecto tiene errores de TypeScript.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;