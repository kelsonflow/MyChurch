import { redirect } from "next/navigation";
import { staff } from "@/lib/supabase";
import { UserManager } from "@/components/user-manager";
export default async function Users() {
  let s;
  try {
    s = await staff(true);
  } catch {
    redirect("/admin");
  }
  const { data, error } = await s.supabase
    .from("profiles")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Pessoas que cuidam.</h1>
          <p>
            Convites e permissões. O último administrador ativo está protegido.
          </p>
        </div>
      </div>
      <UserManager profiles={data || []} />
    </>
  );
}
