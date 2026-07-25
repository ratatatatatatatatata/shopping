"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function ContactMessageForm() {
  const [sent, setSent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="card space-y-4 p-6"
    >
      <h2 className="font-display text-lg font-bold">Мессеж илгээх</h2>
      <div>
        <label className="label">Нэр</label>
        <input required className="input" placeholder="Таны нэр" />
      </div>
      <div>
        <label className="label">И-мэйл</label>
        <input required type="email" className="input" placeholder="email@example.com" />
      </div>
      <div>
        <label className="label">Мессеж</label>
        <textarea required className="input min-h-[120px]" placeholder="Таны асуулт..." />
      </div>
      {sent ? (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          Мессеж илгээгдлээ. Бид удахгүй хариулах болно!
        </p>
      ) : (
        <button type="submit" className="btn-primary w-full">
          <Send className="h-4 w-4" /> Илгээх
        </button>
      )}
    </form>
  );
}
