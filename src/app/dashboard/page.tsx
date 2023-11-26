import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";

export default async function Page() {
  const { sessionClaims } = auth();
  console.log("sessionClaims", sessionClaims?.organizations);
  console.log(sessionClaims?.sub);
  redirect(`/usr/${sessionClaims?.sub}`);
}
