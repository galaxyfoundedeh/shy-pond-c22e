export interface Env {
  AI: {
    run(model: string, inputs: Record<string, any>): Promise<ReadableStream>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "POST") {
      try {
        const { prompt } = await request.json();

        if (!prompt) {
          return new Response(JSON.stringify({ error: "missing prompt" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const inputs = { prompt };

        const response = await env.AI.run(
          "@cf/stabilityai/stable-diffusion-xl-base-1.0",
          inputs
        );

        return new Response(response, {
          headers: {
            "content-type": "image/png",
          },
        });
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "failed to generate image" }),
          {
            status: 500,
            headers: { "content-type": "application/json" },
          }
        );
      }
    }

    // return html for GET requests
    if (request.method === "GET") {
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>AI Image Generator</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #111;
                color: #fff;
                text-align: center;
                padding: 20px;
              }
              input, button {
                padding: 10px;
                margin: 10px;
                border-radius: 5px;
                border: none;
                font-size: 16px;
              }
              button {
                background-color: #4caf50;
                color: white;
                cursor: pointer;
              }
              img {
                margin-top: 20px;
                max-width: 100%;
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <h1>AI Image Generator</h1>
            <input type="text" id="prompt" placeholder="Enter a prompt..." />
            <button onclick="generateImage()">Generate</button>
            <br />
            <img id="result" alt="" />
            <script>
              window.generateImage = async () => {
                const prompt = (document.getElementById('prompt') as HTMLInputElement).value;
                if (!prompt) {
                  alert('please enter a prompt');
                  return;
                }

                const response = await fetch('/', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ prompt })
                });

                if (response.ok) {
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  (document.getElementById('result') as HTMLImageElement).src = url;
                } else {
                  alert('failed to generate image');
                }
              };
            </script>
          </body>
        </html>`,
        {
          headers: {
            "content-type": "text/html",
          },
        }
      );
    }

    return new Response("method not allowed", { status: 405 });
  },
} satisfies ExportedHandler<Env>;
