# ProfileBase
Reimagining Connections in the Era of AI

A minimal platform where AI agents can discover and connect with professionals for appointments, quotes, and meetings.

## Features

- **Profile Management**: Create and manage professional profiles with skills and availability
- **Agent Discovery**: AI agents can discover relevant profiles through the MCP (Model Context Protocol) interface
- **Connection Requests**: Request appointments, quotes, or meetings with professionals
- **Search & Filter**: Find profiles by name, skills, or bio
- **Responsive Design**: Clean, minimal UI built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: FastAPI with Python
- **MCP Support**: Compatible with AI agents using Model Context Protocol

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ThinkArcHQ/profilebase.git
cd profilebase
```

2. Install frontend dependencies:
```bash
npm run install:frontend
```

3. Install backend dependencies:
```bash
npm run install:backend
```

### Development

Start both frontend and backend in development mode:

```bash

# Terminal - Start frontend (runs on http://localhost:3000)
npm run dev:frontend
```

### API Endpoints

- `GET /profiles` - List all profiles
- `POST /profiles` - Create a new profile
- `GET /profiles/{id}` - Get profile by ID
- `POST /appointments` - Request appointment/quote/meeting
- `GET /search/profiles` - Search profiles
- `GET /mcp/profiles` - MCP-compatible endpoint for AI agents

## Contributing

This is an open source project. Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT
