class ApiSuccess<T = any> {
  code: number;
  message: string;
  data?: T;

  constructor(code: number, message: string, data?: T) {
    this.code = code;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
  }
}

export default ApiSuccess;
