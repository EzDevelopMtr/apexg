import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LoginForm from "../../components/login-form";
import { findCompanyProfile } from "../../lib/company-profile";

interface GymPageProps {
  readonly params: Promise<{ gym: string }>;
}

/** Each gym's own entrance: `<link>/apex-gym`. */
export async function generateMetadata({ params }: GymPageProps): Promise<Metadata> {
  const profile = await findCompanyProfile((await params).gym);
  return {
    title: { absolute: profile ? `Iniciar sesión | ${profile.name}` : "Gimnasio no encontrado" },
  };
}

export default async function GymLoginPage({ params }: GymPageProps) {
  const profile = await findCompanyProfile((await params).gym);
  if (!profile) notFound();

  return (
    <LoginForm gym={profile.slug} suspended={profile.status === "suspended"} />
  );
}
