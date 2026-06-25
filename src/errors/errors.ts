export class UnImportantError extends Error {
  constructor(err: string) {
    super(err);
    Object.setPrototypeOf(this, UnImportantError.prototype);
  }
}

export class NotInGuildError extends UnImportantError {
  constructor() {
    super("Este commando solo puede ser ejecutado en una guild.");
    Object.setPrototypeOf(this, UnImportantError.prototype);
  }
}

export class BotInVCError extends UnImportantError {
  constructor() {
    super("Ya estoy en un VC");
    Object.setPrototypeOf(this, BotInVCError.prototype);
  }
}

export class UserNotInVCError extends UnImportantError {
  constructor() {
    super("Connectate a un VC primero.");
    Object.setPrototypeOf(this, UserNotInVCError.prototype);
  }
}

export class UserNotInSameVCError extends UnImportantError {
  constructor() {
    super("Necesitas estar en el mismo VC que yo");
    Object.setPrototypeOf(this, UserNotInSameVCError.prototype);
  }
}
