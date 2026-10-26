// DJI: QueryBusInterface::ask / CommandBusInterface::dispatch.
// JS Map ghép lớp DTO với handler. Bus KHÔNG log payload/password và không truy vấn DB.
export class MessageBus {
  #handlers = new Map();
  register(messageType, handler) {
    if (this.#handlers.has(messageType))
      throw new Error(`Duplicate handler: ${messageType.name}`);
    this.#handlers.set(messageType, handler);
    return this;
  }
  async execute(message) {
    const handler = this.#handlers.get(message?.constructor);
    if (!handler)
      throw new Error(`No handler for ${message?.constructor?.name}`);
    return handler(message);
  }
}
export class QueryBus extends MessageBus {
  ask(query) {
    return this.execute(query);
  }
}
export class CommandBus extends MessageBus {
  dispatch(command) {
    return this.execute(command);
  }
}
export const queryBus = new QueryBus();
export const commandBus = new CommandBus();
