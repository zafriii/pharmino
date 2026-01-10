import { Suspense } from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import Load from "@/components/Load";
import ReceivedProductsWrapper from "@/components/Admin/Purchase/ReceivedProducts/ReceivedProductsWrapper";
import FetchReceivedProducts from "@/components/Admin/Purchase/ReceivedProducts/FetchReceivedProducts";

interface ReceivedProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function ReceivedProductsPage({ searchParams }: ReceivedProductsPageProps) {
  const resolvedParams = await searchParams;
  
  return (
    <PageContainer title="Received Products">
      <div className="space-y-6">
        <ReceivedProductsWrapper>
          <div >
            <Suspense fallback={<Load message='Loading Received Prodcuts'/>}>
              <FetchReceivedProducts searchParams={resolvedParams} />
            </Suspense>
          </div>
        </ReceivedProductsWrapper>
      </div>
    </PageContainer>
  );
}