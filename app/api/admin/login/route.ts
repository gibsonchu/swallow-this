import { redirect } from "next/navigation";
import { setAdminCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") || "");

  if (verifyPassword(password)) {
    await setAdminCookie();
    redirect("/admin");
  }

  redirect("/admin?error=1");
}
