import { SignInCard } from "@/components/auth/auth-card";

export default function SignInPage() {
  const enableGoogle = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <SignInCard enableGoogle={enableGoogle} />
    </div>
  );
}
