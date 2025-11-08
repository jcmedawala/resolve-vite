"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"

interface SignupFormProps extends React.ComponentProps<"div"> {
  onBackToLogin?: () => void;
}

export function SignupForm({
  className,
  onBackToLogin,
  ...props
}: SignupFormProps) {
  const { signIn } = useAuthActions();
  const validateSecretCode = useMutation(api.adminAuth.validateSecretCode);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const secretCode = formData.get("secretCode") as string;

    try {
      // First, validate the secret code
      await validateSecretCode({ secretCode });

      // Create auth form data for signup
      const authFormData = new FormData();
      authFormData.set("email", email);
      authFormData.set("password", password);
      authFormData.set("flow", "signUp");
      // Store additional fields in form data for later retrieval
      authFormData.set("firstName", firstName);
      authFormData.set("lastName", lastName);
      authFormData.set("name", `${firstName} ${lastName}`);

      // Sign up the user using the Password provider
      await signIn("password", authFormData);

      // The user profile will be automatically updated by our custom auth hook
      // which watches for new signups and updates the profile accordingly
      
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create Admin Account</CardTitle>
          <CardDescription>
            Fill in the form below to create your admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    required
                    disabled={isLoading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    disabled={isLoading}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                />
                <FieldDescription>
                  Your work email address.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading}
                />
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="secretCode">Admin Secret Code</FieldLabel>
                <Input
                  id="secretCode"
                  name="secretCode"
                  type="password"
                  required
                  disabled={isLoading}
                />
                <FieldDescription>
                  Enter the admin secret code to complete registration.
                </FieldDescription>
              </Field>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Creating Account..." : "Create Admin Account"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="underline underline-offset-4 hover:no-underline"
                  >
                    Sign in
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
