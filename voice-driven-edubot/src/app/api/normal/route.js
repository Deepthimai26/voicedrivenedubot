import { NextResponse } from "next/server";

const AVAILABLE_MODELS = [
  "provider-6/llama-3.2-1b-instruct",
  "provider-3/gpt-4o-mini", // OpenAI default
  "provider-6/gemma-3-27b-instruct",
  "provider-3/gemini-2.5-flash-lite-preview-09-2025",
];

export async function POST(req) {
  try {
    const { messages, model } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid or missing 'messages' array." },
        { status: 400 }
      );
    }

    // Use OpenAI default if no model selected
    const defaultModel = "provider-3/gpt-4o-mini";
    const selectedModel = AVAILABLE_MODELS.includes(model) ? model : defaultModel;

    const userMessage = messages[messages.length - 1].content.toLowerCase();

    // Detect if the user wants a diagram (flowchart/graph/chart keywords)
    const wantsDiagram =
      /\b(flowchart|diagram|chart|graph|process|structure|cycle)\b/i.test(
        userMessage
      );

    if (wantsDiagram) {
      // Simply ask the model to generate mermaid code
      const response = await fetch("https://api.a4f.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_A4F_API_KEY}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...messages,
            {
              role: "system",
              content:
                "You are an assistant. If the user asks for a diagram or flowchart, provide the result as Mermaid syntax.",
            },
          ],
        }),
      });

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "";
      return NextResponse.json({ answer });
    }

    // Normal text response
    const response = await fetch("https://api.a4f.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_A4F_API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
      }),
    });

    const data = await response.json();
    let answer = data.choices?.[0]?.message?.content || "";

    // Cleanup Markdown
    answer = answer
      .replace(/([a-zA-Z]+)\s*[\r\n]+Copy Code[\r\n]+/g, "```$1\n")
      .replace(/(?<!`)Copy Code/g, "")
      .replace(/(?<!`)Example:/g, "\n\n")
      .replace(/(?<!`)Conclusion/g, "\n\n**Conclusion**")
      .trim();

    const codeBlockCount = (answer.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) answer += "\n```";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch response" },
      { status: 500 }
    );
  }
}
