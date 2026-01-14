"use client";

export default function LocalDate({ date }: { date: string }) {
  return (
    <>
      {new Date(date).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </>
  );
}
