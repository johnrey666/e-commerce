import { EditProductClient } from "./EditProductClient";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  return <EditProductClient id={id} />;
}
