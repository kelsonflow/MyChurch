import { listRecords, getRecord } from "@/lib/store";
import { staff } from "@/lib/firebase";
import { MediaManager } from "@/components/media-manager";
export default async function Media() {
  await staff();
  const data = (await listRecords<any>("media")).sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Imagens com histórias.</h1>
          <p>A biblioteca visual da nossa comunidade.</p>
        </div>
      </div>
      <MediaManager media={data || []} />
    </>
  );
}
