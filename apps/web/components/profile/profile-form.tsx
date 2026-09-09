"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, type ProfileActionResult } from "@/lib/profile/actions";
import type { Profile } from "@/lib/profile/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const INITIAL: ProfileActionResult = { ok: false };

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfile, INITIAL);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Nome de exibição" error={state.fieldErrors?.name}>
        {(field) => (
          <Input
            {...field}
            name="name"
            defaultValue={profile?.name ?? ""}
            required
            autoComplete="name"
          />
        )}
      </Field>
      <Field label="Headline" hint="Título profissional curto." error={state.fieldErrors?.headline}>
        {(field) => <Input {...field} name="headline" defaultValue={profile?.headline ?? ""} />}
      </Field>
      <Field
        label="Introdução"
        hint="Aparece logo abaixo do nome na landing."
        error={state.fieldErrors?.intro}
      >
        {(field) => (
          <Textarea {...field} name="intro" rows={3} defaultValue={profile?.intro ?? ""} />
        )}
      </Field>
      <Field label="Sobre / Trajetória" error={state.fieldErrors?.about}>
        {(field) => (
          <Textarea {...field} name="about" rows={7} defaultValue={profile?.about ?? ""} />
        )}
      </Field>

      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-[color:var(--pdi-success)]">
          Perfil salvo.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar perfil"}
        </Button>
      </div>
    </form>
  );
}
