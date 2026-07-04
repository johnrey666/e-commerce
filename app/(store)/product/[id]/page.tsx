import { ProductDetailClient } from "./ProductDetailClient";

export default async function ProductPage({
  params,
}: PageProps<"/product/[id]">) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
