import { staff } from "@/lib/supabase";
import { MediaManager } from "@/components/media-manager";
export default async function Media() {
  const { supabase } = await staff();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
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
