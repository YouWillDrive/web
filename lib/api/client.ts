// API Client for YouWillDrive application
// Handles all backend API communications with proper error handling

import { RecordId } from "surrealdb";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  surname: string;
  patronymic?: string;
  phone: string;
  role: string;
}

export interface Plan {
  id: string;
  name: string;
  practice_hours: number;
  price: number;
  theory_hours: number;
}

export interface Transmission {
  id: string;
  name: string;
}

export interface Instructor {
  id: string;
  name: string;
  surname: string;
  patronymic?: string;
  phone: string;
}

export interface Chat {
  id: string;
  cadetName: string;
  instructorName: string;
  lastMessage: string;
  lastMessageTime: string | Date | null;
  messageCount: number;
  lastActivity: string | Date | null;
  cadetPhone: string;
  instructorPhone: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  date_sent: string | Date;
  sender: {
    id: string;
    name: string;
    surname: string;
    phone: string;
    role: string;
  };
}

export interface Car {
  id: string;
  model: string;
  plateNumber: string;
  color: string;
}

export interface CadetConfig {
  paymentPlan: string;
  instructorId: string;
  isAutomatic: boolean;
  spentHours: number;
  bonusHours: number;
}

export interface EventParticipant {
  id: string;
  name: string;
  surname: string;
  patronymic: string;
}

export interface EventType {
  id: string;
  name: string;
}

export interface CalendarEvent {
  id: string;
  date: string | Date; // The DB will return a string
  eventType: EventType;
  cadet?: EventParticipant;
  instructor?: EventParticipant;
}

// Generic API request handler
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Handle different response formats
    if (data.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    return {
      success: true,
      data: data.user || data.users || data.message || data,
      message: data.message,
    };
  } catch (error) {
    console.error("API Request Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

// Auth API methods
export const authApi = {
  async login(phone: string, password: string): Promise<ApiResponse<User>> {
    return apiRequest<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });
  },

  async logout(): Promise<ApiResponse> {
    return apiRequest("/api/auth/logout", {
      method: "POST",
    });
  },

  async getMe(): Promise<ApiResponse<User>> {
    return apiRequest<User>("/api/auth/me");
  },
};

// Users API methods
export const usersApi = {
  async getAll(): Promise<ApiResponse<User[]>> {
    return apiRequest<User[]>("/api/users");
  },

  async create(userData: {
    firstName: string;
    lastName: string;
    patronymic?: string;
    phone: string;
    password: string;
    role: string;
  }): Promise<ApiResponse<User>> {
    return apiRequest<User>("/api/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  async update(
    id: string,
    userData: {
      firstName: string;
      lastName: string;
      patronymic?: string;
      phone: string;
      password?: string;
    },
  ): Promise<ApiResponse<User>> {
    return apiRequest<User>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  async delete(id: string): Promise<ApiResponse> {
    return apiRequest(`/api/users/${id}`, {
      method: "DELETE",
    });
  },
};

// Instructors API methods
export const instructorsApi = {
  async getAll(): Promise<ApiResponse<Instructor[]>> {
    return apiRequest<Instructor[]>("/api/instructors");
  },

  async getCadets(id: string): Promise<ApiResponse<User[]>> {
    return apiRequest<User[]>(`/api/instructors/${id}/cadets`);
  },

  async getCars(id: string): Promise<ApiResponse<Car[]>> {
    return apiRequest<Car[]>(`/api/instructors/${id}/config`);
  },

  async configureCars(id: string, cars: Car[]): Promise<ApiResponse> {
    return apiRequest(`/api/instructors/${id}/config`, {
      method: "POST",
      body: JSON.stringify({ cars }),
    });
  },
};

// Cadets API methods
export const cadetsApi = {
  async getConfig(id: string): Promise<ApiResponse<CadetConfig>> {
    return apiRequest(`/api/cadets/${id}/config`);
  },

  async configure(id: string, config: CadetConfig): Promise<ApiResponse> {
    return apiRequest(`/api/cadets/${id}/config`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  },
};

// Plans API methods
export const plansApi = {
  async getAll(): Promise<ApiResponse<Plan[]>> {
    return apiRequest<Plan[]>("/api/plans");
  },

  async create(planData: Omit<Plan, "id">): Promise<ApiResponse<Plan>> {
    return apiRequest<Plan>("/api/plans", {
      method: "POST",
      body: JSON.stringify(planData),
    });
  },

  async update(
    id: string,
    planData: Partial<Omit<Plan, "id">>,
  ): Promise<ApiResponse<Plan>> {
    return apiRequest<Plan>(`/api/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(planData),
    });
  },

  async delete(id: string): Promise<ApiResponse> {
    return apiRequest(`/api/plans/${id}`, {
      method: "DELETE",
    });
  },
};

// Transmissions API methods
export const transmissionsApi = {
  async getAll(): Promise<ApiResponse<Transmission[]>> {
    return apiRequest<Transmission[]>("/api/transmissions");
  },
};

// Chats API methods
export const chatsApi = {
  async getAll(): Promise<ApiResponse<Chat[]>> {
    return apiRequest<Chat[]>("/api/chats");
  },

  async getMessages(chatId: string): Promise<ApiResponse<ChatMessage[]>> {
    return apiRequest<ChatMessage[]>(`/api/chats/${chatId}`);
  },
};

// Calendar API methods
export const calendarApi = {
  async getEvents(
    year?: number,
    month?: number,
  ): Promise<ApiResponse<CalendarEvent[]>> {
    let url = "/api/calendar/events";

    if (year !== undefined && month !== undefined) {
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString(),
      });
      url += `?${params.toString()}`;
    }

    return apiRequest<CalendarEvent[]>(url);
  },
};

// Combined API object for easy importing
export const api = {
  auth: authApi,
  users: usersApi,
  instructors: instructorsApi,
  cadets: cadetsApi,
  plans: plansApi,
  transmissions: transmissionsApi,
  chats: chatsApi,
  calendar: calendarApi,
};

export default api;
