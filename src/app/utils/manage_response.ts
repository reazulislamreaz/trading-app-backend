import { Response } from "express";
interface IResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  unreadCount?: number;
  meta?: {
    page?: number;
    limit?: number;
    skip?: number;
    total?: number;
    totalPages?: number;
  };
}

const manageResponse = <T>(res: Response, payload: IResponse<T>) => {
  res.status(payload.statusCode).json({
    success: payload.success,
    message: payload.message,
    data: payload.data || undefined || null,
    unreadCount: payload.unreadCount,
    meta: payload.meta || undefined || null,
  });
};

export default manageResponse;
