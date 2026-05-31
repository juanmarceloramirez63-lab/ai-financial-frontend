import type { NextConfig } from "next";

const nextConfig: NextConfig = {
typescript: {
    // !! ADVERTENCIA !!
    // Esto permite que los despliegues en producción completen con éxito
    // incluso si tu proyecto tiene errores de TypeScript.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;