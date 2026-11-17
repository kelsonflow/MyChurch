export type Role = "admin" | "editor";
export type Profile = {
  id: string;
  email: string;
  role: Role;
  status: "active" | "suspended";
  version: number;
  created_at: string;
};
export function assertAccess(profile: Profile | undefined, admin = false) {
  if (
    !profile ||
    profile.status !== "active" ||
    (admin && profile.role !== "admin")
  )
    throw new Error("Sem permissão para esta operação.");
  return profile;
}
export function nextAdmins(
  current: string[],
  id: string,
  role: Role,
  status: string,
  revoke = false,
) {
  const next = current.filter((v) => v !== id);
  if (!revoke && role === "admin" && status === "active") next.push(id);
  if (current.includes(id) && next.length === 0)
    throw new Error(
      "O último administrador ativo não pode ser removido ou suspenso.",
    );
  return next;
}
