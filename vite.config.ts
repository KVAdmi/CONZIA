import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { conziaAiProxyPlugin } from "./devserver/aiProxy";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isAndroidBuild = mode === "android";

  return {
    base: isAndroidBuild ? "./" : "/",
    plugins: [
      react(),
      conziaAiProxyPlugin({
        anthropicApiKey: env.ANTHROPIC_API_KEY,
        anthropicModel: env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
        groqApiKey: env.GROQ_API_KEY,
        groqModel: env.GROQ_MODEL || "llama-3.1-8b-instant",
      }),
    ],
    server: {
      port: 5173,
      strictPort: false,
    },
  };
});
