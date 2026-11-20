export const DOCKER_CONFIG = {
  image: "agent-runtime:latest",

  resources: {
    memory: 512 * 1024 * 1024, // 512 MB
    nanoCpus: 1_000_000_000, // 1 CPU
    pidsLimit: 128,
  },

  security: {
    readonlyRootfs: true,
    capDrop: ["ALL"],
    securityOpt: ["no-new-privileges:true"],
  },

  execution: {
    workingDir: "/workspace",
    user: "10001:10001",
    timeout: 60_000,
  },
} as const;
