"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInCard(props: { enableGoogle: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const callbackURL = useMemo(() => "/dashboard", []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {props.enableGoogle ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await authClient.signIn.social({ provider: "google", callbackURL });
              } catch {
                toast.error("Google sign-in failed");
                setPending(false);
              }
            }}
          >
            Continue with Google
          </Button>
        ) : null}

        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const email = String(form.get("email") ?? "");
            const password = String(form.get("password") ?? "");

            setPending(true);
            const { error } = await authClient.signIn.email({
              email,
              password,
              callbackURL,
            });

            if (error) {
              toast.error(error.message);
              setPending(false);
              return;
            }

            router.push("/dashboard");
            router.refresh();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            Sign in
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        New here? <a className="ml-1 underline" href="/sign-up">Create an account</a>
      </CardFooter>
    </Card>
  );
}

export function SignUpCard(props: { enableGoogle: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const callbackURL = useMemo(() => "/dashboard", []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {props.enableGoogle ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await authClient.signIn.social({ provider: "google", callbackURL });
              } catch {
                toast.error("Google sign-in failed");
                setPending(false);
              }
            }}
          >
            Continue with Google
          </Button>
        ) : null}

        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const name = String(form.get("name") ?? "");
            const email = String(form.get("email") ?? "");
            const password = String(form.get("password") ?? "");

            setPending(true);
            const { error } = await authClient.signUp.email({
              name,
              email,
              password,
              callbackURL,
            });

            if (error) {
              toast.error(error.message);
              setPending(false);
              return;
            }

            router.push("/dashboard");
            router.refresh();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required />
          </div>
          <Button type="submit" disabled={pending}>
            Create account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Already have an account? <a className="ml-1 underline" href="/sign-in">Sign in</a>
      </CardFooter>
    </Card>
  );
}
