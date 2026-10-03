import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { navigation } from "@/lib/demo-data";
import type { Role, Section } from "@/lib/types";

export default async function RolePage({
  params,
}: {
  params: Promise<{ role: string; section?: string[] }>;
}) {
  const { role, section = [] } = await params;
  if (!["yonetici", "formen", "isci"].includes(role) || section.length > 1) notFound();
  const selectedRole = role as Role;
  const selectedSection = (section[0] || "") as Section;
  if (
    selectedSection !== "bildirimler" &&
    selectedSection !== "profil" &&
    !navigation[selectedRole].some((n) => n.section === selectedSection)
  )
    notFound();
  return (
    <Workspace
      key={`${selectedRole}:${selectedSection}`}
      role={selectedRole}
      section={selectedSection}
    />
  );
}
