import { listRecords, getRecord } from "@/lib/store";
import { redirect } from "next/navigation";
import { staff } from "@/lib/firebase";
import { settings } from "@/lib/content";
import { SettingsEditor } from "@/components/settings-editor";
export default async function SettingsPage() {
  let session;
  try {
    session = await staff(true);
  } catch {
    redirect("/admin");
  }
  const [s, media] = await Promise.all([settings(), listRecords("media")]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>A identidade da nossa casa.</h1>
          <p>Configurações gerais · acesso exclusivo de administradores.</p>
        </div>
      </div>
      <SettingsEditor initial={s} media={media || []} />
    </>
  );
}
