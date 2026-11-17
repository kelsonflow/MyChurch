import { listRecords, getRecord } from "@/lib/store";
import { redirect } from "next/navigation";
import { staff } from "@/lib/firebase";
import { UserManager } from "@/components/user-manager";
export default async function Users() {
  let s;
  try {
    s = await staff(true);
  } catch {
    redirect("/admin");
  }
  const data = (await listRecords<any>("profiles")).sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  );
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
