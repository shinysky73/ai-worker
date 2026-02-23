---
name: Defense-in-Depth Validation
description: Validate at every layer data passes through to make bugs impossible
when_to_use: when invalid data causes failures deep in execution, requiring validation at multiple system layers
version: 1.1.0
languages: all
---

# Defense-in-Depth Validation

**Core principle:** Validate at EVERY layer data passes through. Make the bug structurally impossible.

## The Four Layers

### Layer 1: Entry Point Validation
Reject obviously invalid input at API boundary.

```typescript
// NestJS DTO validation
export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  @IsPositive()
  roomId: number;
}
```

```typescript
// Function-level guard
function processChat(roomId: number, message: string) {
  if (!roomId || roomId <= 0) {
    throw new BadRequestException('roomId must be a positive number');
  }
  if (!message?.trim()) {
    throw new BadRequestException('message cannot be empty');
  }
}
```

### Layer 2: Business Logic Validation
Ensure data makes sense for this specific operation.

```typescript
async sendMessage(userId: string, roomId: number, message: string) {
  // Verify room exists AND user has access
  const room = await this.prisma.room.findFirst({
    where: { id: roomId, members: { some: { userId } } },
  });
  if (!room) {
    throw new ForbiddenException('Room not found or access denied');
  }
}
```

### Layer 3: Environment Guards
Prevent dangerous operations in specific contexts (e.g., test isolation).

```typescript
if (process.env.NODE_ENV === 'test') {
  // Prevent accidental external API calls during tests
  if (!process.env.MOCK_AI_PROVIDER) {
    throw new Error('AI provider must be mocked during tests');
  }
}
```

### Layer 4: Debug Instrumentation
Capture context via logging for forensics when other layers fail.

```typescript
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  async processMessage(dto: ChatRequestDto) {
    this.logger.debug('Processing message', {
      roomId: dto.roomId,
      messageLength: dto.message?.length,
      userId: dto.userId,
    });

    try {
      // ... operation
    } catch (error) {
      this.logger.error('Failed to process message', {
        error: error.message,
        stack: error.stack,
        dto,
      });
      throw error;
    }
  }
}
```

## Don't Stop at One Layer

Wrong approach (only validates at entry):
```typescript
// Only in controller - insufficient
@Post('chat')
async chat(@Body() dto: ChatRequestDto) {
  return this.chatService.send(dto); // service has no validation
}
```

Right approach (validates at every layer):
```typescript
// Controller: DTO validation (Layer 1)
@Post('chat')
async chat(@Body() dto: ChatRequestDto) {
  return this.chatService.send(dto);
}

// Service: business logic validation (Layer 2)
async send(dto: ChatRequestDto) {
  const room = await this.validateRoomAccess(dto.roomId, dto.userId);
  // Layer 3: env check if needed
  // Layer 4: log before and after
  this.logger.debug('Sending to AI', { roomId: dto.roomId });
  return this.aiService.complete(dto.message, room.context);
}
```

## Common Validation Points in This Project

| Component | What to Validate |
|-----------|-----------------|
| REST endpoint | DTO shape, auth token |
| WebSocket event | Event data schema, socket auth |
| AI service call | API key present, model valid, token limits |
| Prisma query | Entity exists, user has permission |
| File upload | File type, size limit, malware scan |
| Vector search | Embedding dimension, similarity threshold |
