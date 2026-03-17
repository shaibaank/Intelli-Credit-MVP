import Link from "next/link";

export function Sidebar({ caseId, path }: { caseId: string; path: string }) {
  const subLinks = [
    { label: "Entity Overview", href: `/case/${caseId}/onboarding` },
    { label: "Documents", href: `/case/${caseId}/documents` },
    { label: "Extraction", href: `/case/${caseId}/extraction` },
    { label: "Research", href: `/case/${caseId}/risk-cam?tab=research` },
    { label: "CAM Report", href: `/case/${caseId}/risk-cam?tab=cam` },
  ];

  return (
    <aside className="sticky top-0 h-screen w-[230px] border-r-[3px] border-[#2d2d2d] bg-[#fff9c4] p-4">
      <nav className="space-y-4 text-lg">
        <Link className={`block border-2 border-[#2d2d2d] p-2 ${path.includes("/dashboard") ? "bg-white" : "bg-[#fdfbf7]"}`} href="#">
          Dashboard
        </Link>
        <div className="space-y-2 border-2 border-[#2d2d2d] bg-white p-2">
          <div className="font-bold">Current Case</div>
          {subLinks.map((item) => (
            <Link key={item.label} href={item.href} className="block text-base underline decoration-dashed underline-offset-4">
              {item.label}
            </Link>
          ))}
        </div>
        <Link className="block border-2 border-[#2d2d2d] bg-[#fdfbf7] p-2" href="#">
          History / Cases
        </Link>
        <Link className="block border-2 border-[#2d2d2d] bg-[#fdfbf7] p-2" href="#">
          Admin
        </Link>
      </nav>
    </aside>
  );
}
