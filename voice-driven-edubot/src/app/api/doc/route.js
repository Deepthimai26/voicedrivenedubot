import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let backendUrl;
    let payload;
    let headers = {};

    if (contentType.includes("application/json")) {
      // Query
      const { messages } = await req.json();
      if (!messages || messages.length === 0)
        return NextResponse.json({ error: "No messages provided." }, { status: 400 });

      backendUrl = "http://127.0.0.1:8000/doc/query";
      payload = new URLSearchParams();
      payload.append("question", messages[messages.length - 1].content);
      payload.append("model", "provider-3/gpt-4o-mini");
      payload.append("top_k", "5");
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    } else if (contentType.includes("multipart/form-data")) {
      // File upload
      const formData = await req.formData();
      const files = formData.getAll("files");
      const action = formData.get("action");

      if (!files || files.length === 0)
        return NextResponse.json({ error: "No files uploaded." }, { status: 400 });

      if (action !== "extract")
        return NextResponse.json({ error: "Invalid action." }, { status: 400 });

      backendUrl = "http://127.0.0.1:8000/doc/extract";
      payload = new FormData();
      files.forEach((file) => payload.append("files", file));
    } else {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 400 });
    }

    const response = await fetch(backendUrl, { method: "POST", body: payload, headers });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to process request", details: err.message }, { status: 500 });
  }
}
