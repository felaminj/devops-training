export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'External service unavailable') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

export class EarthquakeDataUnavailableError extends AppError {
  constructor(message = 'No earthquake data is available for the selected source and time range') {
    super(message, 404, 'EARTHQUAKE_DATA_UNAVAILABLE');
  }
}
