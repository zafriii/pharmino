import EmployeeFullProfile from "@/components/HR Management/Directory/EmployeeFullProfile";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <EmployeeFullProfile employeeId={id} />;
}
