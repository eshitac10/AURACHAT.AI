import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express & HTTP Server
const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client securely
// Using process.env.CUSTOM_GEMINI_API_KEY, process.env.ALT_GEMINI_API_KEY or process.env.GEMINI_API_KEY with user-agent configured for telemetry
const effectiveApiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.ALT_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: effectiveApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Server In-Memory State (Source of Truth)
const boardPaths: any[] = [];
let connectedUsers: any[] = [];

// ==========================================
// 1. Full-Stack API Endpoints
// ==========================================

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Chat completion with Gemini 3.5-flash
app.post('/api/chat', async (req, res) => {
  const { messages, systemInstruction } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  try {
    // Map messages to Gemini Content format
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction || 'You are AuraChat, an empathetic and highly creative AI brainstorming companion. Respond with spacious paragraphs and friendly formatting.'
      }
    });

    const replyText = response.text || 'I listened carefully, but I could not formulate an aura output.';
    res.json({ text: replyText });
  } catch (error: any) {
    console.error('Gemini Chat error:', error);
    const errorMessage = error.message || '';
    if (errorMessage.includes('leaked') || errorMessage.includes('API key') || errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('API_KEY_INVALID')) {
      return res.status(403).json({
        error: 'API Key Blocked or Invalid',
        message: 'Your API key was reported as leaked or is invalid. To fix this: Please generate a new API key from Google AI Studio, open the "Secrets" settings menu (using the cog icon on the top right), and add a new secret named "CUSTOM_GEMINI_API_KEY" with your new key value.',
        details: errorMessage
      });
    }
    res.status(500).json({ error: errorMessage || 'Error occurred while talking to Gemini.' });
  }
});

// AI Mood Sentiment Analyzer with Gemini 3.5-flash
app.post('/api/sentiment', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message text is required for sentiment analysis.' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze the mood of this text and return a JSON object representing the user's state. 
Text: "${message}"

You must respond ONLY with a raw JSON object matching this schema exactly. Do not wrap in markdown codeblocks:
{
  "emotion": "Zen" | "Creative" | "Excited" | "Pensive" | "Anxious" | "Joyful" | "Calm" | "Energetic",
  "score": number (0 to 100 representing emotional intensity),
  "color": "a beautiful pastel Hex color matching the emotion aura",
  "insight": "a supportive 1-sentence psychological insight of their text",
  "recommendation": "a 1-sentence prompt for a whiteboard session to creatively harness this emotion"
}`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text?.trim() || '{}';
    // Parse the JSON output safely
    let parsedResult = JSON.parse(rawText);
    res.json(parsedResult);
  } catch (error: any) {
    console.error('Gemini Sentiment error:', error);
    // Graceful fallback
    res.json({
      emotion: 'Calm',
      score: 70,
      color: '#a78bfa',
      insight: 'Your thoughts show a calm, balanced wavelength.',
      recommendation: 'Use the whiteboard to sketch an abstract wave of your focus.'
    });
  }
});


// ==========================================
// 2. Real-Time WebSockets Server on Port 3000
// ==========================================

const wss = new WebSocketServer({ noServer: true });

// Attach WS upgrade logic to HTTP server
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Broadcaster helper
const broadcastToOthers = (senderWs: WebSocket, data: any) => {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

const broadcastToAll = (data: any) => {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

// WebSocket Connection Handler
wss.on('connection', (ws) => {
  let userSessionId: string | null = null;

  // Sync state on initial connection
  ws.send(JSON.stringify({
    type: 'sync_board',
    paths: boardPaths
  }));

  ws.on('message', (messageBuffer) => {
    try {
      const data = JSON.parse(messageBuffer.toString());

      switch (data.type) {
        case 'user_join':
          userSessionId = data.user.id;
          connectedUsers.push(data.user);
          // Send active peer list to the joining user
          ws.send(JSON.stringify({
            type: 'sync_users',
            users: connectedUsers.filter(u => u.id !== userSessionId)
          }));
          // Notify others of the new explorer
          broadcastToOthers(ws, {
            type: 'peer_join',
            user: data.user
          });
          break;

        case 'cursor_move':
          // Broadcast moving cursors
          broadcastToOthers(ws, {
            type: 'peer_cursor',
            userId: data.userId,
            name: data.name,
            color: data.color,
            cursorX: data.cursorX,
            cursorY: data.cursorY
          });
          break;

        case 'draw_start':
          // Save path locally
          boardPaths.push(data.path);
          broadcastToOthers(ws, {
            type: 'peer_draw_start',
            path: data.path
          });
          break;

        case 'draw_move':
          // Append point to matching active path
          const matchingPath = boardPaths.find((p) => p.id === data.pathId);
          if (matchingPath) {
            if (data.tool === 'pen' || data.tool === 'eraser') {
              matchingPath.points.push(data.point);
            } else {
              // Shapes replace the last coordinate
              matchingPath.points = [matchingPath.points[0], data.point];
            }
          }
          broadcastToOthers(ws, {
            type: 'peer_draw_move',
            pathId: data.pathId,
            point: data.point,
            tool: data.tool
          });
          break;

        case 'draw_end':
          broadcastToOthers(ws, {
            type: 'peer_draw_end',
            pathId: data.pathId
          });
          break;

        case 'clear_board':
          // Empty in-memory paths
          boardPaths.length = 0;
          broadcastToAll({ type: 'board_cleared' });
          break;

        case 'unlock_badge':
          broadcastToOthers(ws, {
            type: 'peer_badge_unlocked',
            userName: data.userName,
            badgeName: data.badgeName
          });
          break;

        default:
          break;
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  // Handle Disconnection
  ws.on('close', () => {
    if (userSessionId) {
      connectedUsers = connectedUsers.filter(u => u.id !== userSessionId);
      broadcastToAll({
        type: 'peer_leave',
        userId: userSessionId
      });
    }
  });
});


// ==========================================
// 3. Vite Middleware integration for production/dev
// ==========================================

if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Full Stack Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
