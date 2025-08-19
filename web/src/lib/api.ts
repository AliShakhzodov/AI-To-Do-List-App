export async function createTaskFromNL(text: string, uid: string, family: string) {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, uid, family })
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
