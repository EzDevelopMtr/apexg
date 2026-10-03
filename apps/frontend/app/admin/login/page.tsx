import type { Metadata } from "next";
import PlatformLoginForm from "../../../components/platform-login-form";

export const metadata: Metadata = { title: { absolute: "Panel de plataforma" } };

export default function PlatformLoginPage() {
  return <PlatformLoginForm />;
}
