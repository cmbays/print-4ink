import { getColors } from "@infra/repositories/colors";
import { getAutoPropagationConfig } from "@infra/repositories/settings";
import { SettingsColorsClient } from "./_components/SettingsColorsClient";

export default async function SettingsColorsPage() {
  const [initialColors, propagationConfig] = await Promise.all([
    getColors(),
    getAutoPropagationConfig(),
  ]);

  return (
    <SettingsColorsClient
      initialColors={initialColors}
      initialAutoPropagate={propagationConfig.autoPropagate}
    />
  );
}
