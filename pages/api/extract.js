export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { document } = req.body || {};

    if (!document) {
      return res.status(400).json({ error: "Missing document text" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        input: `
You are a legal document fact extractor.

Return ONLY valid JSON:

{
  "document_type": "",
  "sender_type": "",
  "recipient_role": "",
  "core_issue": "",
  "monetary_amounts": "",
  "deadlines": "",
  "referenced_agreements": "",
  "consequence_language": "",
  "procedural_posture": "",
  "missing_or_unstated_items": ""
}

Document:
${document}
`,
      }),
    });

    const data = await response.json();
    const text = data.output?.[0]?.content?.[0]?.text || "{}";
    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Extraction failed" });
  }
}
