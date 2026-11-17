"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMessage } from "@/app/admin/actions";
export function DeleteMessage({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <>
      <button
        className="button outline"
        disabled={pending}
        onClick={() => {
          if (
            confirm(
              "Eliminar definitivamente esta mensagem e os dados pessoais que contém?",
            )
          )
            start(async () => {
              const result = await deleteMessage(id);
              setMessage(result.message || "");
              router.refresh();
            });
        }}
      >
        Eliminar mensagem
      </button>
      <span role="status">{message}</span>
    </>
  );
}
