import { adminListCategories } from "@/features/admin/queries";
import { AdminPageHead } from "@/features/admin/components/admin-page-head";
import { CategoryEditor } from "@/features/admin/components/category-editor";
import { CategoryList } from "@/features/admin/components/category-list";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await adminListCategories();
  return (
    <>
      <AdminPageHead title="Categories" meta="Order here sets the order in the menu and on the home page." actions={<CategoryEditor category={null} />} />
      <div className="rounded-lg border border-line bg-white">
        <CategoryList categories={categories} />
      </div>
    </>
  );
}
