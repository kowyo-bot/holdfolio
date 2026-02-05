import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Holdfolio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Track items, log uses, and see cost-per-use and holding-days metrics
            as of any date.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/sign-up">Create account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
