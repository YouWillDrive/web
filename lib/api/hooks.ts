import { useState, useEffect, useCallback } from "react";
import { api, ApiResponse } from "./client";

// Generic hook for API calls with loading and error states
export function useApiCall<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  deps: any[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const executeCall = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiCall();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Unknown error occurred");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error occurred");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    executeCall();
  }, [executeCall]);

  const refetch = useCallback(() => {
    executeCall();
  }, [executeCall]);

  return { data, loading, error, refetch };
}

// Hook for users data
export function useUsers() {
  return useApiCall(() => api.users.getAll());
}

// Hook for instructors data
export function useInstructors() {
  return useApiCall(() => api.instructors.getAll());
}

// Hook for payment plans data
export function usePlans() {
  return useApiCall(() => api.plans.getAll());
}

// Hook for transmissions data
export function useTransmissions() {
  return useApiCall(() => api.transmissions.getAll());
}

// Hook for chats data
export function useChats() {
  return useApiCall(() => api.chats.getAll());
}

// Hook for chat messages
export function useChatMessages(chatId: string) {
  return useApiCall(() => api.chats.getMessages(chatId), [chatId]);
}

// Hook for calendar events
export function useCalendarEvents(year?: number, month?: number) {
  return useApiCall(() => api.calendar.getEvents(year, month), [year, month]);
}

// Hook for instructor cadets with manual refetch capability
export function useInstructorCadets(instructorId: string) {
  const [shouldRefetch, setShouldRefetch] = useState(0);

  const result = useApiCall(
    () => api.instructors.getCadets(instructorId),
    [instructorId, shouldRefetch],
  );

  const manualRefetch = useCallback(() => {
    setShouldRefetch((prev) => prev + 1);
  }, []);

  return {
    ...result,
    refetch: manualRefetch,
  };
}

// Hook for async operations with manual trigger
export function useAsyncOperation<T, Args extends any[]>(
  operation: (...args: Args) => Promise<ApiResponse<T>>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (...args: Args) => {
      try {
        setLoading(true);
        setError(null);

        const result = await operation(...args);

        if (result.success) {
          setData(result.data || null);
          return { success: true, data: result.data };
        } else {
          setError(result.error || "Operation failed");
          return { success: false, error: result.error };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Network error occurred";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [operation],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { execute, loading, error, data, reset };
}

// Specific hooks for common operations
export function useCreateUser() {
  return useAsyncOperation(api.users.create);
}

export function useUpdateUser() {
  return useAsyncOperation(api.users.update);
}

export function useConfigureCadet() {
  return useAsyncOperation(api.cadets.configure);
}

export function useGetCadetConfig() {
  return useAsyncOperation(api.cadets.getConfig);
}

export function useConfigureInstructor() {
  return useAsyncOperation(api.instructors.configureCars);
}

export function useDeleteUser() {
  return useAsyncOperation(api.users.delete);
}

export function useCreatePlan() {
  return useAsyncOperation(api.plans.create);
}

export function useUpdatePlan() {
  return useAsyncOperation(api.plans.update);
}

export function useDeletePlan() {
  return useAsyncOperation(api.plans.delete);
}

// Hook for form submissions with validation
export function useFormSubmission<T>(
  submitFn: (data: T) => Promise<ApiResponse<any>>,
  onSuccess?: (result: any) => void,
  onError?: (error: string) => void,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = useCallback(
    async (data: T) => {
      try {
        setIsSubmitting(true);
        setSubmitError(null);

        const result = await submitFn(data);

        if (result.success) {
          onSuccess?.(result.data);
          return { success: true };
        } else {
          const error = result.error || "Submission failed";
          setSubmitError(error);
          onError?.(error);
          return { success: false, error };
        }
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "Network error occurred";
        setSubmitError(error);
        onError?.(error);
        return { success: false, error };
      } finally {
        setIsSubmitting(false);
      }
    },
    [submitFn, onSuccess, onError],
  );

  const clearError = useCallback(() => {
    setSubmitError(null);
  }, []);

  return { submit, isSubmitting, submitError, clearError };
}

export function useGetInstructorCars(instructorId: string) {
  // Only execute the call if instructorId is provided
  return useApiCall(
    () =>
      instructorId
        ? api.instructors.getCars(instructorId)
        : Promise.resolve({ success: true, data: [] }),
    [instructorId],
  );
}
