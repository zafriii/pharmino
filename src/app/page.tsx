import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (  
    <div className="flex flex-col items-center justify-center min-h-screen">    
      <h1 className="text-4xl font-bold mb-8">Welcome to Pharmino</h1>
      <div className="flex gap-4">
        <Link 
          href="/admin/dashboard-overview" 
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}