import admin from "firebase-admin";
import express from "express";
import fetch from "node-fetch";
import { z } from "zod";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as chrono from "chrono-node";

const GROQ_API_KEY = defineSecret("GROQ_API_KEY");
if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

const TaskSchema = z.object({
    title: z.string().min(1),
    participants: z.array(z.string()).default([]),
    due_date_text: z.string().nullable().optional(),   // literal words from LLM
    due_date_iso: z.string().datetime().nullable().optional() // backend populated
});


async function groqExtract(natural, apiKey) {
    const prompt = `Extract a task from the text. Return strict JSON ONLY in this format:
{
  "title": string,
  "participants": string[],
  "due_date_text": string | null
}

Rules:
- Title must be concise and descriptive.
- Participants must be human names or role labels.
- due_date_text must be the exact text of the date/time expression if one exists ("Tuesday", "August 20th", "tomorrow").
- If no date expression exists, use null.
- Do NOT convert relative dates into ISO. Just return the words found. 

Text:
"""${natural}"""`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "llama3-70b-8192",
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: "You are a precise information extractor." },
                { role: "user", content: prompt }
            ]
        })
    });
    if (!res.ok) throw new Error(`Groq API error ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    console.log("Extracted task:", parsed);
    const safe = TaskSchema.parse(parsed);
    return safe;
}

const app = express();
app.use(express.json());

app.post("/api/search", async (req, res) => {
    try {
        const { text } = req.body || {};
        if (!text || typeof text !== "string") return res.status(400).json({ error: "text required" });

        const apiKey = process.env.GROQ_API_KEY;
        const extracted = await groqExtract(text.trim(), apiKey);
        let dueTs = null;
        let dueIso = null;

        if (extracted.due_date_text) {
            const parsedDate = chrono.parseDate(extracted.due_date_text, new Date(), { forwardDate: true });
            if (parsedDate) {
                dueTs = admin.firestore.Timestamp.fromDate(parsedDate);
                dueIso = parsedDate.toISOString();
            }
        }

        const doc = {
            Task_Title: extracted.title,
            Participants: extracted.participants,
            Task_Due_Date: dueTs,      // Firestore Timestamp
            Task_Due_Date_ISO: dueIso, // String ISO (optional, good for debugging)
            Raw_Due_Text: extracted.due_date_text,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            source: "ai",
        };


        const ref = await db.collection("tasks").add(doc);
        const snapshot = await ref.get();
        res.json({ id: ref.id, data: snapshot.data() });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: String(e.message || e) });
    }
});
// Export v2 https function with secret bound
export const api = onRequest({ region: "us-central1", cors: false, secrets: [GROQ_API_KEY] }, app);
