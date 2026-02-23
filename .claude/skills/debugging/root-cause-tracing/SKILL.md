---
name: Root Cause Tracing
description: Systematically trace bugs backward through call stack to find original trigger
when_to_use: when errors occur deep in execution and you need to trace back to find the original trigger
version: 1.1.0
languages: all
---

# Root Cause Tracing

**Core principle:** Trace backward through the call chain until you find the original trigger, then fix at the source.

## The Tracing Process

1. **Observe the symptom** — where does the error appear?
2. **Find immediate cause** — the code line directly responsible
3. **Ask: what called this?** — trace up the call chain
4. **Keep tracing** — what value was passed? Where did it come from?
5. **Find original trigger** — where did the bad value originate?

**NEVER fix just where the error appears.** Trace back to find the original trigger.

## Adding Stack Traces

```typescript
async function someFunction(param: string) {
  const stack = new Error().stack;
  console.error('DEBUG trace:', {
    param,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    stack,
  });
  // ...
}
```

Use `console.error()` in tests — not the logger, which may be suppressed.

## NestJS-Specific Tracing

```typescript
// In a service
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  async processMessage(dto: ChatRequestDto) {
    this.logger.debug('processMessage called', {
      roomId: dto.roomId,
      stack: new Error().stack,
    });
  }
}
```

## Prisma Query Tracing

```typescript
// In prisma.service.ts — enable during debugging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## WebSocket Event Tracing

```typescript
// In gateway
@SubscribeMessage('chat')
handleChat(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
  console.error('DEBUG WebSocket event:', {
    event: 'chat',
    clientId: client.id,
    data,
    stack: new Error().stack,
  });
}
```

## Finding Test Polluters

When tests pollute shared state (e.g., a test creates files that affect other tests), use the bisection script:

```bash
./find-polluter.sh '.git' 'src/**/*.test.ts'
```

See: `find-polluter.sh` in this directory.

## Common Patterns

| Symptom | Trace From | Look For |
|---------|-----------|----------|
| Prisma error | Query call | Missing `await`, wrong ID type |
| 401 Unauthorized | Auth guard | JWT expiry, missing header |
| WebSocket disconnect | Event handler | Unhandled exception, memory leak |
| Type error | Function call | DTO validation failure, null value |
| Test failure | Test assertion | State leakage from previous test |
